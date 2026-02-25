import type { LegacyBaseStationRow, LegacyCellRow, LegacyLocationRow } from "../legacyTypes.js";
import { logger } from "../logger.js";
import { mapDuplex, mapStandardToRat, stripNotes, toInt, type Rat } from "../utils.js";

function safeDate(value: string | null | undefined, context: { type: string; id: number; field: string }): Date | null {
  if (!value || value === "0000-00-00 00:00:00" || value.trim() === "") {
    logger.warn(`[WARN] Invalid date in ${context.type} id=${context.id} field="${context.field}": "${value}". Setting it to now()`);
    return new Date();
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    logger.warn(`[WARN] Invalid date in ${context.type} id=${context.id} field="${context.field}": "${value}". Setting it to now()`);
    return new Date();
  }
  return d;
}

export interface PreparedRegion {
  name: string;
  code: string;
}
export interface PreparedOperator {
  name: string;
  full_name: string;
  mnc: number;
}
export interface PreparedLocation {
  original_id: number;
  region_name: string;
  city: string | null;
  address: string | null;
  longitude: number;
  latitude: number;
  date_added: Date | null;
  date_updated: Date | null;
}
export interface PreparedStation {
  original_id: number;
  operator_mnc: number;
  location_original_id: number;
  station_id: string;
  notes: string | null;
  extra_address: string | null;
  status: "published" | "inactive" | "pending";
  is_confirmed: boolean;
  date_added: Date | null;
  date_updated: Date | null;
}
export interface PreparedBandKey {
  rat: Rat;
  value: number;
  duplex: "FDD" | "TDD" | null;
}

export interface PreparedCellBase {
  original_id: number;
  station_original_id: number;
  band_key: PreparedBandKey;
  rat: Rat;
  notes: string | null;
  is_confirmed: boolean;
  date_added: Date | null;
  date_updated: Date | null;
}
export interface PreparedGSMDetails {
  lac: number | null;
  cid: number | null;
  e_gsm: boolean;
}
export interface PreparedUMTSDetails {
  lac: number | null;
  rnc: number;
  cid: number;
  arfcn: number | null;
}
export interface PreparedLTEDetails {
  tac: number | null;
  enbid: number;
  clid: number;
  pci: number | null;
  supports_nb_iot: boolean;
}
export interface PreparedNRDetails {
  nrtac: number | null;
  gnbid: number | null;
  clid: number | null;
  pci: number | null;
  type: "nsa" | "sa";
  supports_nr_redcap: boolean;
}

export type PreparedCell =
  | (PreparedCellBase & { rat: "GSM"; gsm: PreparedGSMDetails })
  | (PreparedCellBase & { rat: "UMTS"; umts: PreparedUMTSDetails })
  | (PreparedCellBase & { rat: "LTE"; lte: PreparedLTEDetails })
  | (PreparedCellBase & { rat: "NR"; nr: PreparedNRDetails });

const LEGACY_REGION_NAMES: Record<number, string> = {
  1: "Dolnośląskie",
  2: "Kujawsko-pomorskie",
  3: "Lubelskie",
  4: "Lubuskie",
  5: "Łódzkie",
  6: "Małopolskie",
  7: "Mazowieckie",
  8: "Opolskie",
  9: "Podkarpackie",
  10: "Podlaskie",
  11: "Pomorskie",
  12: "Śląskie",
  13: "Świętokrzyskie",
  14: "Warmińsko-mazurskie",
  15: "Wielkopolskie",
  16: "Zachodniopomorskie",
};

export function prepareLocations(rows: LegacyLocationRow[]): PreparedLocation[] {
  return rows
    .filter((loc) => {
      if (loc.address === "" && loc.town === "" && loc.latitude === "0.000000" && loc.longitude === "0.000000") {
        logger.warn(`[WARN] Skipping location id=${loc.id}: empty address/town and zero coordinates`);
        return false;
      }
      return true;
    })
    .map((loc) => ({
      original_id: loc.id,
      region_name: LEGACY_REGION_NAMES[loc.region_id] ?? "",
      city: loc.town?.trim() || null,
      address: loc.address?.trim() || null,
      longitude: toInt(loc.longitude) ?? 0,
      latitude: toInt(loc.latitude) ?? 0,
      date_added: safeDate(loc.date_added, { type: "location", id: loc.id, field: "date_added" }),
      date_updated: safeDate(loc.date_updated, { type: "location", id: loc.id, field: "date_updated" }),
    }));
}

export function prepareStations(rows: LegacyBaseStationRow[], mncToOperatorName: Map<number, string>): PreparedStation[] {
  return rows
    .filter((station) => {
      if (station.station_id === "") {
        logger.warn(`[WARN] Skipping station id=${station.id}: empty station_id`);
        return false;
      }
      return true;
    })
    .map((station) => {
      const operator_mnc = Number(String(station.network_id).trim());
      let stationId = station.station_id;

      if (stationId.startsWith("?,")) {
        stationId = stationId.substring(2);
        const operatorName = mncToOperatorName.get(operator_mnc);

        switch (operatorName) {
          case "T-Mobile":
            stationId = `O-${stationId}`;
            break;
          case "Orange":
            stationId = `T-${stationId}`;
            break;
        }
      }

      return {
        original_id: station.id,
        operator_mnc,
        location_original_id: station.location_id,
        station_id: stationId,
        notes: station.notes ? stripNotes(station.notes.trim(), [/\bnetworks?\b/gi]) : null,
        extra_address: station.location_details?.trim() || null,
        status: normalizeStatus(station.station_status),
        is_confirmed: station.edit_status.toLowerCase() === "published",
        date_added: safeDate(station.date_added, { type: "station", id: station.id, field: "date_added" }),
        date_updated: safeDate(station.date_updated, { type: "station", id: station.id, field: "date_updated" }),
      };
    });
}

export function prepareBands(cells: LegacyCellRow[]): PreparedBandKey[] {
  const keys: PreparedBandKey[] = [];
  for (const cell of cells) {
    const rat = mapStandardToRat(cell.standard || "");
    if (!rat) {
      logger.warn(`[WARN] Skipping band for cell id=${cell.id}: unknown standard "${cell.standard}"`);
      continue;
    }
    const rawBand = toInt(cell.band);
    const value = rawBand ?? (cell.band === "?" ? 0 : null);
    if (value === null) {
      logger.warn(`[WARN] Skipping band for cell id=${cell.id}: null/zero band value "${cell.band}"`);
      continue;
    }
    const duplex = mapDuplex(cell.duplex) ?? (rat === "UMTS" ? "FDD" : null);
    keys.push({ rat, value, duplex });
  }
  const seen = new Set<string>();
  const out: PreparedBandKey[] = [];
  for (const key of keys) {
    const id = `${key.rat}:${key.value}:${key.duplex ?? ""}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(key);
  }
  return out;
}

export function prepareCells(rows: LegacyCellRow[], basestationsById: Map<number, LegacyBaseStationRow>): PreparedCell[] {
  const out: PreparedCell[] = [];
  for (const cell of rows) {
    const rat = mapStandardToRat(cell.standard || "");
    if (!rat) {
      logger.warn(`[WARN] Skipping cell id=${cell.id}: unknown standard "${cell.standard}"`);
      continue;
    }
    const station = basestationsById.get(cell.base_station_id);
    if (!station) {
      logger.warn(`[WARN] Skipping cell id=${cell.id}: no base station found for base_station_id=${cell.base_station_id}`);
      continue;
    }
    const rawCellBand = toInt(cell.band);
    const bandValue = rawCellBand ?? (cell.band === "?" ? 0 : null);
    if (bandValue === null) {
      logger.warn(`[WARN] Skipping cell id=${cell.id}: null/zero band value "${cell.band}"`);
      continue;
    }
    const band_key: PreparedBandKey = {
      rat,
      value: bandValue,
      duplex: mapDuplex(cell.duplex) ?? (rat === "UMTS" ? "FDD" : null),
    };
    const base: PreparedCellBase = {
      original_id: cell.id,
      station_original_id: cell.base_station_id,
      band_key,
      rat,
      notes: cell.notes ? stripNotes(cell.notes?.trim(), [/\bnetworks?\b/gi, /\[E-GSM\]/gi]) : null,
      is_confirmed: cell.is_confirmed === "1",
      date_added: safeDate(cell.date_added, { type: "cell", id: cell.id, field: "date_added" }),
      date_updated: safeDate(cell.date_updated, { type: "cell", id: cell.id, field: "date_updated" }),
    };

    switch (rat) {
      case "GSM":
        {
          const lac = toInt(cell.lac);
          const cid = toInt(cell.cid);
          if (lac === null || cid === null) logger.warn(`[WARN] Skipping GSM cell id=${cell.id}: invalid lac="${cell.lac}" or cid="${cell.cid}"`);
          const isEgsm = cell.standard?.toUpperCase() === "E-GSM" || (cell.notes?.includes("[E-GSM]") ?? false);
          out.push({ ...base, rat, gsm: { lac, cid, e_gsm: isEgsm } });
        }
        break;
      case "UMTS":
        {
          const rnc = toInt(station.rnc) ?? 0;
          const cid = toInt(cell.cid) ?? 0;
          if (rnc === null || cid === null) logger.warn(`[WARN] Skipping UMTS cell id=${cell.id}: rnc=${rnc}, cid=${cid} (both required)`);
          out.push({ ...base, rat, umts: { lac: toInt(cell.lac), rnc, cid, arfcn: toInt(cell.ua_freq) } });
        }
        break;
      case "LTE":
        {
          const enbid = toInt(station.enbi) ?? 0;
          const tac = toInt(cell.lac) ?? null;
          let clid = toInt(cell.cid) ?? 0;
          if (clid < 0) clid = 0;
          if (clid > 255) clid = clid % 256;
          if (enbid === null || clid === null) logger.warn(`[WARN] Skipping LTE cell id=${cell.id}: enbid=${enbid}, clid=${clid} (both required)`);
          out.push({ ...base, rat, lte: { tac, enbid, clid, pci: null, supports_nb_iot: false } });
        }
        break;
      case "NR":
        {
          const gnbid = null;
          const clid = null;
          const nrtac = null;
          const pci = null;
          out.push({ ...base, rat, nr: { nrtac, gnbid, clid, pci, type: "nsa", supports_nr_redcap: false } });
        }
        break;
    }
  }
  return out;
}

function normalizeStatus(status: string | null | undefined): "published" | "inactive" | "pending" {
  const val = (status || "").toLowerCase();
  if (val.includes("onair") || val.includes("published")) return "published";
  if (val.includes("inactive") || val.includes("off")) return "inactive";
  return "pending";
}
