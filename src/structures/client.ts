import {
  Collection,
  Client as DiscordClient,
  ClientOptions as DiscordClientOptions,
  Events,
  Interaction,
} from 'discord.js';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import {
  deployCommands,
  loadCommands,
  loadInternalValidations,
  loadValidations,
} from '@/handlers/commands';
import { loadEvents } from '@/handlers/events';
import { createErrorEmbed } from '@/utils/embeds';
import Command from '@/structures/command';
import Validator from '@/structures/validation';

export interface ModuleLoaderOptions {
  eventsDir?: string;
  commandsDir?: string;
  validationsDir?: string;
}

export interface ClientOptions extends DiscordClientOptions {
  moduleLoader?: ModuleLoaderOptions;
}

export default class Client extends DiscordClient {
  moduleLoader: Required<ModuleLoaderOptions> = {
    eventsDir: 'events',
    commandsDir: 'commands',
    validationsDir: 'validations',
  };

  commands: Collection<string, Command> = new Collection();
  limiters: Collection<string, RateLimiterMemory> = new Collection();
  validations: Array<Validator> = [];

  constructor(options: ClientOptions) {
    const { moduleLoader: moduleLoaderOptions, ...clientOptions } = options;

    super(clientOptions);

    if (moduleLoaderOptions) {
      this.moduleLoader = { ...this.moduleLoader, ...moduleLoaderOptions };
    }

    this.once(Events.ClientReady, async () => {
      await deployCommands(this);
    });

    this.on(Events.InteractionCreate, async (interaction: Interaction) => {
      await this.handleCommandInteraction(interaction);
    });
  }

  async initialize(token: string): Promise<void> {
    await Promise.all([
      loadEvents(this),
      loadCommands(this),
      loadInternalValidations(this),
      loadValidations(this),
    ]);

    await this.login(token);
  }

  private async handleCommandInteraction(
    interaction: Interaction,
  ): Promise<void> {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isContextMenuCommand() &&
      !interaction.isMessageContextMenuCommand() &&
      !interaction.isUserContextMenuCommand()
    ) {
      return;
    }

    const commandName = interaction.commandName.toLowerCase();
    const command = this.commands.get(commandName);

    if (!command) {
      console.error(`No command matching ${commandName} was found.`);
      return;
    }

    let isValid = true;

    for (const validation of this.validations) {
      isValid = await validation.execute(command, interaction, this);

      if (!isValid) {
        break;
      }
    }

    if (!isValid) {
      const embed = createErrorEmbed('This command cannot be executed.');

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      }

      return;
    }

    try {
      await command.execute(interaction, this);
    } catch (err) {
      console.error(err);

      const embed = createErrorEmbed('Unknown error.');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }
}
