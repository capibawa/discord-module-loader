import { GuildMember } from 'discord.js';

import Validation from '@/structures/validation';
import { createErrorEmbed } from '@/utils/embeds';

export default new Validation({
  execute: async (command, interaction) => {
    if (!command.userPermissions) {
      return true;
    }

    const permissions = (interaction.member as GuildMember)?.permissions;

    if (!permissions) {
      await interaction.reply({
        embeds: [createErrorEmbed('Failed to fetch user permissions.')],
      });

      return false;
    }

    const missingPermissions = permissions.missing(command.userPermissions);

    if (missingPermissions.length > 0) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            `Missing user permissions: ${missingPermissions.join(', ')}`,
          ),
        ],
      });

      return false;
    }

    return true;
  },
});
