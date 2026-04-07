import { sql, inArray, or, gte, lte, type SQL } from "drizzle-orm";
import { stations, cells, gsmCells, umtsCells, lteCells, nrCells, locations, extraIdentificators, stationPhotoSelections } from "@openbts/drizzle";
import { z } from "zod/v4";

export type FilterValue = string | number | boolean;
export type FilterTable = "stations" | "cells" | "gsmCells" | "umtsCells" | "lteCells" | "nrCells" | "locations" | "extraIdentificators";
export type FilterCondition = {
  table: FilterTable;
  buildCondition: (value: FilterValue) => SQL;
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
const numericListSchema = z
  .string()
  .transform((value) => splitList(value).map((item) => Number(item)))
  .pipe(z.array(z.number().int()).min(1));
const stringListSchema = z
  .string()
  .transform((value) => splitList(value))
  .pipe(z.array(z.string().min(1)).min(1));
const ratListSchema = z
  .string()
  .transform((value) => splitList(value).map((item) => item.toUpperCase()))
  .pipe(z.array(z.enum(["GSM", "UMTS", "LTE", "NR"])).min(1));
const booleanSchema = z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true");

function parseNumbers(v: FilterValue): number[] {
  return numericListSchema.parse(String(v));
}

function parseStrings(v: FilterValue): string[] {
  return stringListSchema.parse(String(v));
}

function parseRats(v: FilterValue): ("GSM" | "UMTS" | "LTE" | "NR")[] {
  return ratListSchema.parse(String(v));
}

function parseBoolean(v: FilterValue): boolean {
  return booleanSchema.parse(v);
}

const buildInArray =
  <T>(column: T, parser: (value: FilterValue) => readonly unknown[]) =>
  (value: FilterValue) =>
    inArray(column as never, parser(value));

const buildBooleanEq =
  <T>(column: T) =>
  (value: FilterValue) =>
    sql`${column as never} = ${parseBoolean(value)}`;

const buildLikeAny =
  <T>(column: T) =>
  (value: FilterValue) => {
    const values = parseStrings(value);
    const conditions = values.map((val) => sql`${column as never} ILIKE ${`%${val}%`}`);
    return (conditions.length === 1 ? conditions[0] : or(...conditions)) as SQL;
  };

const buildDateGte =
  <T>(column: T) =>
  (value: FilterValue) =>
    gte(column as never, new Date(String(value)));

const buildDateLte =
  <T>(column: T) =>
  (value: FilterValue) => {
    const date = new Date(String(value));
    date.setHours(23, 59, 59, 999);
    return lte(column as never, date);
  };

const buildInArrayFromSubquery =
  <T>(column: T, buildSubquery: (values: number[]) => SQL) =>
  (value: FilterValue) =>
    inArray(column as never, buildSubquery(parseNumbers(value)));

const buildInArrayFromStringSubquery =
  <T>(column: T, buildSubquery: (values: string[]) => SQL) =>
  (value: FilterValue) =>
    inArray(column as never, buildSubquery(parseStrings(value)));

export const FILTER_DEFINITIONS: Record<string, FilterCondition> = {
  // stations
  bts_id: {
    table: "stations",
    buildCondition: buildLikeAny(stations.station_id),
  },
  mnc: {
    table: "stations",
    buildCondition: buildInArrayFromSubquery(stations.operator_id, (values) => sql`(SELECT id FROM operators WHERE mnc IN ${values})`),
  },

  created_after: {
    table: "stations",
    buildCondition: buildDateGte(stations.createdAt),
  },
  created_before: {
    table: "stations",
    buildCondition: buildDateLte(stations.createdAt),
  },
  updated_after: {
    table: "stations",
    buildCondition: buildDateGte(stations.updatedAt),
  },
  updated_before: {
    table: "stations",
    buildCondition: buildDateLte(stations.updatedAt),
  },

  has_photo: {
    table: "stations",
    buildCondition: (value: FilterValue) => {
      const hasPhoto = parseBoolean(value);
      const subquery = sql`(SELECT 1 FROM ${stationPhotoSelections} WHERE ${stationPhotoSelections.station_id} = ${stations.id})`;
      return hasPhoto ? sql`EXISTS ${subquery}` : sql`NOT EXISTS ${subquery}`;
    },
  },

  // cells
  band: {
    table: "cells",
    buildCondition: buildInArrayFromSubquery(cells.band_id, (values) => sql`(SELECT id FROM bands WHERE value IN ${values})`),
  },
  rat: {
    table: "cells",
    buildCondition: buildInArray(cells.rat, parseRats),
  },
  is_confirmed: {
    table: "cells",
    buildCondition: buildBooleanEq(cells.is_confirmed),
  },
  cell_notes: {
    table: "cells",
    buildCondition: buildLikeAny(cells.notes),
  },

  // gsmCells
  lac: {
    table: "gsmCells",
    buildCondition: buildInArray(gsmCells.lac, parseNumbers),
  },
  cid: {
    table: "gsmCells",
    buildCondition: buildInArray(gsmCells.cid, parseNumbers),
  },

  // umtsCells
  rnc: {
    table: "umtsCells",
    buildCondition: buildInArray(umtsCells.rnc, parseNumbers),
  },
  umts_cid: {
    table: "umtsCells",
    buildCondition: buildInArray(umtsCells.cid, parseNumbers),
  },
  cid_long: {
    table: "umtsCells",
    buildCondition: buildInArray(umtsCells.cid_long, parseNumbers),
  },
  umts_lac: {
    table: "umtsCells",
    buildCondition: buildInArray(umtsCells.lac, parseNumbers),
  },

  // lteCells
  enbid: {
    table: "lteCells",
    buildCondition: buildInArray(lteCells.enbid, parseNumbers),
  },
  ecid: {
    table: "lteCells",
    buildCondition: buildInArray(lteCells.ecid, parseNumbers),
  },
  lte_clid: {
    table: "lteCells",
    buildCondition: buildInArray(lteCells.clid, parseNumbers),
  },
  tac: {
    table: "lteCells",
    buildCondition: buildInArray(lteCells.tac, parseNumbers),
  },
  lte_pci: {
    table: "lteCells",
    buildCondition: buildInArray(lteCells.pci, parseNumbers),
  },
  earfcn: {
    table: "lteCells",
    buildCondition: buildInArray(lteCells.earfcn, parseNumbers),
  },
  supports_iot: {
    table: "lteCells",
    buildCondition: buildBooleanEq(lteCells.supports_iot),
  },

  // nrCells
  gnbid: {
    table: "nrCells",
    buildCondition: buildInArray(nrCells.gnbid, parseNumbers),
  },
  nci: {
    table: "nrCells",
    buildCondition: buildInArray(nrCells.nci, parseNumbers),
  },
  nr_clid: {
    table: "nrCells",
    buildCondition: buildInArray(nrCells.clid, parseNumbers),
  },
  nrtac: {
    table: "nrCells",
    buildCondition: buildInArray(nrCells.nrtac, parseNumbers),
  },
  nr_pci: {
    table: "nrCells",
    buildCondition: buildInArray(nrCells.pci, parseNumbers),
  },
  supports_nr_redcap: {
    table: "nrCells",
    buildCondition: buildBooleanEq(nrCells.supports_nr_redcap),
  },

  // gps
  gps: {
    table: "locations",
    buildCondition: (value: FilterValue) => {
      const [latStr = "", lngStr = ""] = String(value).split(",");
      const lat = Number.parseFloat(latStr.trim());
      const lng = Number.parseFloat(lngStr.trim());
      return sql`ST_DWithin(${locations.point}::geography, ST_MakePoint(${lng}, ${lat})::geography, 1000)`;
    },
  },

  // locations
  region: {
    table: "locations",
    buildCondition: buildInArrayFromStringSubquery(
      locations.region_id,
      (values) =>
        sql`(SELECT id FROM regions WHERE code IN (${sql.join(
          values.map((v) => sql`${v.toUpperCase()}`),
          sql`, `,
        )}))`,
    ),
  },
  city: {
    table: "locations",
    buildCondition: (value: FilterValue) => {
      const values = parseStrings(value);
      const conditions = values.map((val) => sql`(${val} <% ${locations.city} OR ${locations.city} ILIKE ${`%${val}%`})`);
      return (conditions.length === 1 ? conditions[0] : or(...conditions)) as SQL;
    },
  },
  address: {
    table: "locations",
    buildCondition: (value: FilterValue) => {
      const values = parseStrings(value);
      const conditions = values.map((val) => sql`(${val} <% ${locations.address} OR ${locations.address} ILIKE ${`%${val}%`})`);
      return (conditions.length === 1 ? conditions[0] : or(...conditions)) as SQL;
    },
  },

  // extraIdentificators
  networks_id: {
    table: "extraIdentificators",
    buildCondition: (value: FilterValue) => {
      const values = parseStrings(value);
      const conditions = values.map((val) => sql`CAST(${extraIdentificators.networks_id} AS TEXT) ILIKE ${`%${val}%`}`);
      return (conditions.length === 1 ? conditions[0] : or(...conditions)) as SQL;
    },
  },
  networks_name: {
    table: "extraIdentificators",
    buildCondition: buildLikeAny(extraIdentificators.networks_name),
  },
  mno_name: {
    table: "extraIdentificators",
    buildCondition: buildLikeAny(extraIdentificators.mno_name),
  },
};

export type ParsedFilters = Record<string, FilterValue>;

export type GroupedFilters = {
  stations: SQL[];
  cells: SQL[];
  gsmCells: SQL[];
  umtsCells: SQL[];
  lteCells: SQL[];
  nrCells: SQL[];
  locations: SQL[];
  extraIdentificators: SQL[];
};

const filterRegex =
  /(\w+):\s*(?:'([^']*)'|"([^"]*)"|(true|false)|(\d{4}-\d{2}-\d{2})|([a-zA-Z0-9][a-zA-Z0-9]*(?:,\s*[a-zA-Z0-9][a-zA-Z0-9]*)*)|([+-]?\d+\.\d+,\s*[+-]?\d+\.\d+)|(\d+(?:,\s*\d+)*))/gi;

type FilterMatch = {
  key: string;
  value: FilterValue;
  raw: string;
};

const parseFilterMatch = (match: RegExpMatchArray): FilterMatch | null => {
  const key = match[1]?.toLowerCase();
  if (!key) return null;

  const stringValue = match[2] ?? match[3];
  const booleanValue = match[4];
  const dateValue = match[5];
  const alphanumericValue = match[6];
  const coordinateValue = match[7];
  const numericValue = match[8];

  if (stringValue !== undefined) return { key, value: stringValue, raw: match[0] };
  if (booleanValue !== undefined) return { key, value: booleanValue === "true", raw: match[0] };
  if (dateValue !== undefined) return { key, value: dateValue, raw: match[0] };
  if (coordinateValue !== undefined) return { key, value: coordinateValue, raw: match[0] };
  if (numericValue !== undefined) return { key, value: numericValue, raw: match[0] };
  if (alphanumericValue !== undefined) return { key, value: alphanumericValue, raw: match[0] };

  return null;
};

const createEmptyGroupedFilters = (): GroupedFilters => ({
  stations: [],
  cells: [],
  gsmCells: [],
  umtsCells: [],
  lteCells: [],
  nrCells: [],
  locations: [],
  extraIdentificators: [],
});

const implicitGpsRegex = /([+-]?\d+\.\d+)[,\s]+\s*([+-]?\d+\.\d+)/;

export function parseFilterQuery(query: string): { filters: ParsedFilters; remainingQuery: string } {
  const filters: ParsedFilters = {};
  let remainingQuery = query;

  for (const match of query.matchAll(filterRegex)) {
    const parsed = parseFilterMatch(match);
    if (!parsed) continue;
    if (!FILTER_DEFINITIONS[parsed.key]) continue;

    filters[parsed.key] = parsed.value;
    remainingQuery = remainingQuery.replace(parsed.raw, "").trim();
  }

  if (!filters.gps) {
    const gpsMatch = remainingQuery.match(implicitGpsRegex);
    if (gpsMatch) {
      const lat = Number.parseFloat(gpsMatch[1]!);
      const lng = Number.parseFloat(gpsMatch[2]!);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        filters.gps = `${lat},${lng}`;
        remainingQuery = remainingQuery.replace(gpsMatch[0], "").trim();
      }
    }
  }

  return { filters, remainingQuery };
}

export function groupFiltersByTable(filters: ParsedFilters): GroupedFilters {
  return Object.entries(filters).reduce((grouped, [key, value]) => {
    const definition = FILTER_DEFINITIONS[key];
    if (definition) grouped[definition.table].push(definition.buildCondition(value));
    return grouped;
  }, createEmptyGroupedFilters());
}

export function hasFilters(filters: ParsedFilters): boolean {
  return Object.keys(filters).length > 0;
}
