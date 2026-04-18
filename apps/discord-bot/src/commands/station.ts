import type { ChatInputCommandInteraction, StringSelectMenuInteraction } from "discord.js";
import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";

import { getStation, getStationPem, getStationPhotos, searchStations } from "../api.js";
import { buildCellsView, buildPhotosView, buildStationView } from "../embeds/station.js";

const V2 = MessageFlags.IsComponentsV2 as const;

function errorReply(message: string) {
  return {
    flags: V2,
    components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(message))],
  };
}

export async function handleStationCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const stationId = interaction.options.getString("id", true).trim();

  let dbId: number;
  try {
    const results = await searchStations(stationId, 1);
    if (results.length === 0) throw new Error("not found");
    dbId = results[0]!.id;
  } catch {
    await interaction.reply({ content: `Stacja **${stationId}** nie została znaleziona.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const [station, photos] = await Promise.all([getStation(dbId).catch(() => null), getStationPhotos(dbId).catch(() => [])]);

  if (!station) {
    await interaction.reply({ content: `Stacja **${stationId}** nie została znaleziona.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const pem = await getStationPem(station).catch(() => []);
  const pemUrl = pem[0]?.url;

  await interaction.reply(buildStationView(station, photos, pemUrl));
}

export async function handleStationNavMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const value = interaction.values[0];
  if (!value) return;

  await interaction.deferUpdate();

  const [view, rawId] = value.split(":");
  const stationId = Number(rawId);

  let station;
  try {
    station = await getStation(stationId);
  } catch {
    await interaction.editReply(errorReply("Stacja nie została znaleziona."));
    return;
  }

  const photos = await getStationPhotos(stationId).catch(() => []);

  if (view === "s") {
    const pem = await getStationPem(station).catch(() => []);
    await interaction.editReply(buildStationView(station, photos, pem[0]?.url));
  } else if (view === "p") await interaction.editReply(buildPhotosView(station, photos));
  else if (view === "c") await interaction.editReply(buildCellsView(station, photos));
}
