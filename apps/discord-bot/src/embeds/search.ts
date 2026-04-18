import type { BaseMessageOptions } from "discord.js";
import {
  ActionRowBuilder,
  MessageFlags,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from "discord.js";

import type { StationSummary } from "../api.js";

type MessageComponent = NonNullable<BaseMessageOptions["components"]>[number];

export type SearchReply = { flags: typeof MessageFlags.IsComponentsV2; components: MessageComponent[] };

export function buildSearchView(query: string, results: StationSummary[]): SearchReply {
  const components: MessageComponent[] = [
    new TextDisplayBuilder().setContent(
      results.length === 0
        ? `## Search: "${query}"\nBrak stacji.`
        : `## Search: "${query}"\nZnaleziono **${results.length}** stację${results.length === 1 ? "" : "s"}. Wybierz jedną poniżej.`,
    ),
  ];

  if (results.length > 0) {
    const menu = new StringSelectMenuBuilder().setCustomId("sr").setPlaceholder("Wybierz stację");

    for (const station of results.slice(0, 25)) {
      const option = new StringSelectMenuOptionBuilder().setLabel(station.station_id).setValue(String(station.id));
      const parts: string[] = [];
      if (station.operator) parts.push(station.operator.name);
      if (station.location) parts.push(station.location.city);
      if (parts.length > 0) option.setDescription(parts.join(" · ").slice(0, 100));
      menu.addOptions(option);
    }

    components.push(new SeparatorBuilder(), new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
  }

  return { flags: MessageFlags.IsComponentsV2, components };
}
