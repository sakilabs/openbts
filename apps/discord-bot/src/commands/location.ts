import type { ChatInputCommandInteraction } from "discord.js";

import { getLocation } from "../api.js";
import { buildLocationView } from "../embeds/location.js";

export async function handleLocationCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getInteger("id", true);
  await interaction.deferReply();

  let location;
  try {
    location = await getLocation(id);
  } catch {
    await interaction.editReply({ content: `Lokalizacja o ID **${id}** nie została znaleziona.` });
    return;
  }

  await interaction.editReply(buildLocationView(location));
}
