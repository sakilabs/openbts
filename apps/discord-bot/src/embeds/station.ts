import type { BaseMessageOptions } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from "discord.js";

import type { Cell, GsmDetails, LteDetails, NrDetails, Photo, Station, UmtsDetails } from "../api.js";
import { photoUrl, stationUrl } from "../api.js";
import { operatorDot } from "../utils.js";

function ratSummary(cells: Cell[]): string {
  const counts: Record<string, number> = {};
  for (const cell of cells) counts[cell.rat] = (counts[cell.rat] ?? 0) + 1;
  return Object.entries(counts)
    .map(([rat, n]) => `**${rat}**: ${n}`)
    .join(" · ");
}

type MessageComponent = NonNullable<BaseMessageOptions["components"]>[number];

export type StationReply = { flags: typeof MessageFlags.IsComponentsV2; components: MessageComponent[] };

export function buildStationNav(
  stationId: number,
  photos: Photo[],
  current: "station" | "cells" | "photos",
): ActionRowBuilder<StringSelectMenuBuilder> {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setValue(`s:${stationId}`)
      .setLabel("Informacje")
      .setEmoji("🗼")
      .setDefault(current === "station"),
  ];

  if (photos.length > 0) {
    options.push(
      new StringSelectMenuOptionBuilder()
        .setValue(`p:${stationId}`)
        .setLabel(`Zdjęcia (${photos.length})`)
        .setEmoji("📷")
        .setDefault(current === "photos"),
    );
  }

  options.push(
    new StringSelectMenuOptionBuilder()
      .setValue(`c:${stationId}`)
      .setLabel("Komórki")
      .setEmoji("📡")
      .setDefault(current === "cells"),
  );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder().setCustomId("st:nav").setPlaceholder("Nawiguj").addOptions(options),
  );
}

export function buildStationView(station: Station, photos: Photo[], pemUrl?: string): StationReply {
  const mainPhoto = photos.find((p) => p.is_main) ?? photos[0];
  const url = stationUrl(station);

  const components: MessageComponent[] = [];

  if (mainPhoto) components.push(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(photoUrl(mainPhoto.attachment_uuid))));

  const ei = station.extra_identificators;
  components.push(new TextDisplayBuilder().setContent(`### ${station.station_id} ${ei ? `(${ei.mno_name})` : ""}`));

  const details = [
    `${operatorDot(station.operator.name)}${station.operator.name} · ${station.location.region.name}`,
    `📍 ${station.location.city}, ${station.location.address}`,
    `🌐 ${station.location.latitude.toFixed(5)}°N ${station.location.longitude.toFixed(5)}°E`,
  ];
  if (station.cells.length > 0) details.push(`📶 ${ratSummary(station.cells)}`);

  if (ei) {
    if (ei.networks_name ?? ei.networks_id) {
      const label = ei.networks_name ?? "";
      const id = ei.networks_id !== null ? ` (N!${ei.networks_id})` : "";
      details.push(`NetWorks: **${label}${id}**`);
    }
  }

  components.push(new TextDisplayBuilder().setContent(details.join("\n")));

  if (station.notes) components.push(new TextDisplayBuilder().setContent(`> ${station.notes}`));

  components.push(
    new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("Zobacz na BTSearch"))
      .setButtonAccessory(new ButtonBuilder().setLabel("Otwórz").setStyle(ButtonStyle.Link).setURL(url)),
  );

  if (pemUrl) {
    components.push(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("SI2PEM raport"))
        .setButtonAccessory(new ButtonBuilder().setLabel("Otwórz").setStyle(ButtonStyle.Link).setURL(pemUrl)),
    );
  }

  components.push(new SeparatorBuilder(), buildStationNav(station.id, photos, "station"));

  return { flags: MessageFlags.IsComponentsV2, components };
}

function formatCellDetails(cell: Cell): string {
  const { rat, details } = cell;
  if (!details) return "-";

  switch (rat) {
    case "GSM": {
      const d = details as unknown as GsmDetails;
      return `CID: ${d.cid} · LAC: ${d.lac}${d.e_gsm ? " · E-GSM" : ""}`;
    }
    case "UMTS": {
      const d = details as unknown as UmtsDetails;
      return `RNC: ${d.rnc} · CID: ${d.cid} · LongCID: ${d.cid_long}${d.lac !== null ? ` · LAC: ${d.lac}` : ""}`;
    }
    case "LTE": {
      const d = details as unknown as LteDetails;
      const parts = [`eNBID: ${d.enbid}`, `CLID: ${d.clid}`, `E-CID: ${d.ecid}`];
      if (d.tac !== null) parts.push(`TAC: ${d.tac}`);
      if (d.pci !== null) parts.push(`PCI: ${d.pci}`);
      if (d.supports_iot) parts.push("IoT");
      return parts.join(" · ");
    }
    case "NR": {
      const d = details as unknown as NrDetails;
      const parts: string[] = [];
      if (d.gnbid !== null) parts.push(`gNBID: ${d.gnbid}`);
      if (d.clid !== null) parts.push(`CLID: ${d.clid}`);
      if (d.nrtac !== null) parts.push(`NR-TAC: ${d.nrtac}`);
      if (d.nci !== null) parts.push(`NCI: ${d.nci}`);
      if (d.pci !== null) parts.push(`PCI: ${d.pci}`);
      parts.push(d.type.toUpperCase());
      if (d.supports_nr_redcap) parts.push("RedCap");
      return parts.join(" · ");
    }
  }
}

export function buildPhotosView(station: Station, photos: Photo[]): StationReply {
  const gallery = new MediaGalleryBuilder().addItems(
    ...photos.slice(0, 10).map((p) => new MediaGalleryItemBuilder().setURL(photoUrl(p.attachment_uuid))),
  );

  const header = `### ${station.station_id} ${station.extra_identificators?.mno_name ? `(${station.extra_identificators.mno_name})` : ""}`;

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [new TextDisplayBuilder().setContent(header), gallery, new SeparatorBuilder(), buildStationNav(station.id, photos, "photos")],
  };
}

export function buildCellsView(station: Station, photos: Photo[]): StationReply {
  const ei = station.extra_identificators;
  const components: MessageComponent[] = [
    new TextDisplayBuilder().setContent(`### ${station.station_id} ${ei ? `(${ei.mno_name})` : ""}`),
    new SeparatorBuilder(),
  ];

  if (station.cells.length === 0) {
    components.push(new TextDisplayBuilder().setContent("Brak zarejestrowanych komórek."));
  } else {
    const byRat = new Map<string, Cell[]>();
    for (const cell of station.cells) {
      const group = byRat.get(cell.rat) ?? [];
      group.push(cell);
      byRat.set(cell.rat, group);
    }

    const RAT_ORDER = ["GSM", "UMTS", "LTE", "NR"] as const;
    const MAX = 10;
    for (const rat of RAT_ORDER) {
      const cells = byRat.get(rat);
      if (!cells?.length) continue;

      const lines = cells.map((c) => `${c.band.name.replace(new RegExp(`^${rat}\\s*`, "i"), "")} - ${formatCellDetails(c)}`);
      const display = lines.length > MAX ? [...lines.slice(0, MAX), `_i ${lines.length - MAX} więcej_`] : lines;

      components.push(new TextDisplayBuilder().setContent(`**${rat}**\n${display.join("\n")}`));
    }
  }

  components.push(new SeparatorBuilder(), buildStationNav(station.id, photos, "cells"));

  return { flags: MessageFlags.IsComponentsV2, components };
}
