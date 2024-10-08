import { Colors, EmbedBuilder } from 'discord.js';

export function createErrorEmbed(message: string) {
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle('Error!')
    .setDescription(message);
}
