import { existsSync } from "node:fs";
import path from "node:path";
import { sqlParser } from "../classes/parser.js";
import type { LegacyBaseStationRow, LegacyCellRow, LegacyLocationRow } from "../legacyTypes.js";
import { logger } from "../logger.js";

export interface LegacyData {
  locations: LegacyLocationRow[];
  baseStations: LegacyBaseStationRow[];
  cells: LegacyCellRow[];
}

const columnMappings: Record<string, Record<string, string>> = {
  bts_basestation: {
    BaseStationId: "id",
    NetworkCode: "network_id",
    LocationId: "location_id",
    LocationDetails: "location_details",
    StationId: "station_id",
    Rnc: "rnc",
    IsCommonBcch: "is_common_bcch",
    IsGsm: "is_gsm",
    IsUmts: "is_umts",
    IsCdma: "is_cdma",
    IsLte: "is_lte",
    is_5g: "is_5g",
    BaseStationNotes: "notes",
    StationStatus: "station_status",
    EditStatus: "edit_status",
    DateAdded: "date_added",
    DateUpdated: "date_updated",
    is_networks: "is_networks",
    enbi: "enbi",
  },
  bts_cell: {
    CellId: "id",
    BaseStationId: "base_station_id",
    Standard: "standard",
    Band: "band",
    duplex: "duplex",
    UaFreq: "ua_freq",
    Lac: "lac",
    Cid: "cid",
    CidLong: "cid_long",
    azimuth: "azimuth",
    IsConfirmed: "is_confirmed",
    CellNotes: "notes",
    DateUpdated: "date_updated",
    DateAdded: "date_added",
    DatePing: "date_ping",
  },
  bts_location: {
    LocationId: "id",
    RegionId: "region_id",
    Town: "town",
    Address: "address",
    Latitude: "latitude",
    Longitude: "longitude",
    LatLngHash: "location_hash",
    DateAdded: "date_added",
    DateUpdated: "date_updated",
  },
};

function normalize(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function mapRows<T extends object>(columns: string[], values: (string | number | null)[][]): T[] {
  return values.map((row) => {
    const out: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      out[col] = row[i];
    });
    return out as T;
  });
}

function readSingleFile<T extends object>(dir: string, name: string, mapping?: Record<string, string>): T[] {
  const file = path.join(dir, `${name}.sql`);
  if (!existsSync(file)) {
    logger.warn(`[WARN] File not found, skipping: ${file}`);
    return [];
  }
  const inserts = sqlParser.parseSQLFile(file);
  const normalizedName = normalize(name);
  const relevant = inserts.filter((insert) => normalize(insert.table).includes(normalizedName));
  if (!relevant.length) {
    logger.warn(`[WARN] No INSERT statements matching "${name}" found in ${file}, skipping`);
    return [];
  }
  const candidate = relevant.find((i) => i.columns.length);
  const base = candidate ?? relevant[0];
  if (!base) {
    logger.warn(`[WARN] No usable INSERT base found for "${name}" in ${file}, skipping`);
    return [];
  }
  const columns = base.columns.slice().map((col) => {
    if (!mapping) return col;
    return mapping[col] ?? col;
  });
  const allValues: (string | number | null)[][] = [];
  for (const ins of relevant) {
    for (const row of ins.values) allValues.push(row);
  }
  return mapRows<T>(columns, allValues);
}

export function loadLegacyData(partialDir: string): LegacyData {
  const locations = readSingleFile<LegacyLocationRow>(partialDir, "bts_location", columnMappings.bts_location);
  const baseStations = readSingleFile<LegacyBaseStationRow>(partialDir, "bts_basestation", columnMappings.bts_basestation);
  const cells = readSingleFile<LegacyCellRow>(partialDir, "bts_cell", columnMappings.bts_cell);

  return {
    locations,
    baseStations,
    cells,
  };
}
