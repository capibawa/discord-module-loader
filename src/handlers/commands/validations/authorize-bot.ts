import Validation from '@/structures/validation.js';
import { createErrorEmbed } from '@/utils/embeds.js';

export default new Validation({
  execute: async (command, interaction) => {
    if (!command.botPermissions) {
      return true;
    }

    const permissions = interaction.guild?.members.me?.permissions;

    if (!permissions) {
      await interaction.reply({
        embeds: [createErrorEmbed('Failed to fetch bot permissions.')],
      });

      return false;
    }

    const missingPermissions = permissions.missing(command.botPermissions);

    if (missingPermissions.length > 0) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            `Missing bot permissions: ${missingPermissions.join(', ')}`,
          ),
        ],
      });

      return false;
    }

    return true;
  },
});
