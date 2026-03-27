import { Readable } from "node:stream";
import { z } from "zod/v4";
import { and, inArray, eq } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { bands, cells, gsmCells, locations, lteCells, nrCells, operators, regions, stations, umtsCells } from "@openbts/drizzle";
import { convertToCLF, type ClfFormat, type CellExportData } from "../../../../utils/clf-export.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { FastifyReply } from "fastify";
import type { Route } from "../../../../interfaces/routes.interface.js";

const NETWORKS_MNC = 26034;
const NETWORKS_CHILD_MNCS = [26002, 26003];

const schemaRoute = {
  querystring: z.object({
    format: z.enum(["2.0", "2.1", "3.0-dec", "3.0-hex", "4.0", "ntm", "netmonitor"]).default("4.0"),
    operators: z
      .string()
      .optional()
      .transform((val) =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
    regions: z
      .string()
      .optional()
      .transform((val) =>
        val
          ? val
              .split(",")
              .map((code) => code.trim().toUpperCase())
              .filter((code) => code.length === 3)
          : undefined,
      ),
    rat: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const validRats = new Set(["GSM", "UMTS", "LTE", "NR", "IOT"]);
        const rats = val.split(",").filter((r) => validRats.has(r.toUpperCase()));
        return rats.length > 0 ? (rats.map((r) => r.toUpperCase()) as ("GSM" | "UMTS" | "LTE" | "NR" | "IOT")[]) : undefined;
      }),
    bands: z
      .string()
      .optional()
      .transform((val) =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
  }),
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

async function handler(req: FastifyRequest<ReqQuery>, res: FastifyReply) {
  const { format, operators: operatorMncs, regions: regionCodes, rat, bands: bandIds } = req.query;
  let resolvedOperatorIds: number[] | undefined;
  if (operatorMncs && operatorMncs.length > 0) {
    const mncs = new Set(operatorMncs);
    if (mncs.has(NETWORKS_MNC)) for (const child of NETWORKS_CHILD_MNCS) mncs.add(child);

    const matched = await db.query.operators.findMany({
      where: { mnc: { in: [...mncs] } },
      columns: { id: true },
    });
    resolvedOperatorIds = matched.map((o) => o.id);
  }

  const stationConditions = [];
  if (resolvedOperatorIds && resolvedOperatorIds.length > 0) stationConditions.push(inArray(stations.operator_id, resolvedOperatorIds));
  if (regionCodes && regionCodes.length > 0) stationConditions.push(inArray(regions.code, regionCodes));

  const baseConditions = [...stationConditions];
  if (bandIds && bandIds.length > 0) baseConditions.push(inArray(bands.value, bandIds));

  const runGsm = !rat || rat.includes("GSM");
  const runUmts = !rat || rat.includes("UMTS");
  const runLte = !rat || rat.includes("LTE") || rat.includes("IOT");
  const runNr = !rat || rat.includes("NR") || rat.includes("IOT");

  const lteConditions = [...baseConditions];
  if (rat?.includes("IOT") && !rat.includes("LTE")) lteConditions.push(eq(lteCells.supports_iot, true));
  const nrConditions = [...baseConditions];
  if (rat?.includes("IOT") && !rat.includes("NR")) nrConditions.push(eq(nrCells.supports_nr_redcap, true));

  const commonSelect = {
    notes: cells.notes,
    station_sid: stations.station_id,
    extra_address: stations.extra_address,
    operator_mnc: operators.mnc,
    latitude: locations.latitude,
    longitude: locations.longitude,
    city: locations.city,
    address: locations.address,
    region_code: regions.code,
    band_value: bands.value,
    band_name: bands.name,
    band_duplex: bands.duplex,
  };

  const gsmQuery = runGsm
    ? db
        .select({ ...commonSelect, gsm_lac: gsmCells.lac, gsm_cid: gsmCells.cid, gsm_e_gsm: gsmCells.e_gsm })
        .from(cells)
        .innerJoin(gsmCells, eq(gsmCells.cell_id, cells.id))
        .innerJoin(stations, eq(cells.station_id, stations.id))
        .innerJoin(bands, and(eq(cells.band_id, bands.id), eq(bands.variant, "commercial")))
        .leftJoin(operators, eq(stations.operator_id, operators.id))
        .leftJoin(locations, eq(stations.location_id, locations.id))
        .leftJoin(regions, eq(locations.region_id, regions.id))
        .where(and(...baseConditions))
    : null;

  const umtsQuery = runUmts
    ? db
        .select({
          ...commonSelect,
          umts_lac: umtsCells.lac,
          umts_rnc: umtsCells.rnc,
          umts_cid: umtsCells.cid,
          umts_cid_long: umtsCells.cid_long,
          umts_arfcn: umtsCells.arfcn,
        })
        .from(cells)
        .innerJoin(umtsCells, eq(umtsCells.cell_id, cells.id))
        .innerJoin(stations, eq(cells.station_id, stations.id))
        .innerJoin(bands, and(eq(cells.band_id, bands.id), eq(bands.variant, "commercial")))
        .leftJoin(operators, eq(stations.operator_id, operators.id))
        .leftJoin(locations, eq(stations.location_id, locations.id))
        .leftJoin(regions, eq(locations.region_id, regions.id))
        .where(and(...baseConditions))
    : null;

  const lteQuery = runLte
    ? db
        .select({
          ...commonSelect,
          station_pk: stations.id,
          lte_tac: lteCells.tac,
          lte_enbid: lteCells.enbid,
          lte_clid: lteCells.clid,
          lte_ecid: lteCells.ecid,
        })
        .from(cells)
        .innerJoin(lteCells, eq(lteCells.cell_id, cells.id))
        .innerJoin(stations, eq(cells.station_id, stations.id))
        .innerJoin(bands, and(eq(cells.band_id, bands.id), eq(bands.variant, "commercial")))
        .leftJoin(operators, eq(stations.operator_id, operators.id))
        .leftJoin(locations, eq(stations.location_id, locations.id))
        .leftJoin(regions, eq(locations.region_id, regions.id))
        .where(and(...lteConditions))
    : null;

  const nrQuery = runNr
    ? db
        .select({ ...commonSelect, nr_nrtac: nrCells.nrtac, nr_gnbid: nrCells.gnbid, nr_clid: nrCells.clid, nr_nci: nrCells.nci })
        .from(cells)
        .innerJoin(nrCells, eq(nrCells.cell_id, cells.id))
        .innerJoin(stations, eq(cells.station_id, stations.id))
        .innerJoin(bands, and(eq(cells.band_id, bands.id), eq(bands.variant, "commercial")))
        .leftJoin(operators, eq(stations.operator_id, operators.id))
        .leftJoin(locations, eq(stations.location_id, locations.id))
        .leftJoin(regions, eq(locations.region_id, regions.id))
        .where(and(...nrConditions))
    : null;

  const nrBandsQuery = db
    .select({ station_id: cells.station_id, band_value: bands.value, band_duplex: bands.duplex })
    .from(cells)
    .innerJoin(nrCells, and(eq(nrCells.cell_id, cells.id), eq(nrCells.type, "nsa")))
    .innerJoin(bands, and(eq(cells.band_id, bands.id), eq(bands.variant, "commercial")))
    .innerJoin(stations, eq(cells.station_id, stations.id))
    .leftJoin(locations, eq(stations.location_id, locations.id))
    .leftJoin(regions, eq(locations.region_id, regions.id))
    .where(and(...stationConditions));

  const [gsmRows, umtsRows, lteRows, nrRows, nrBandRows] = await Promise.all([
    gsmQuery ?? Promise.resolve([]),
    umtsQuery ?? Promise.resolve([]),
    lteQuery ?? Promise.resolve([]),
    nrQuery ?? Promise.resolve([]),
    nrBandsQuery,
  ]);

  const stationNrBandsMap = new Map<number, Array<{ value: number; duplex: "FDD" | "TDD" | null }>>();
  for (const row of nrBandRows) {
    if (!row.band_value) continue;
    const list = stationNrBandsMap.get(row.station_id) ?? [];
    list.push({ value: row.band_value, duplex: row.band_duplex ?? null });
    stationNrBandsMap.set(row.station_id, list);
  }

  const clfLines: string[] = [];

  for (const row of gsmRows) {
    const line = convertToCLF(
      {
        cid: row.gsm_cid ?? 0,
        lac: row.gsm_lac,
        rat: "GSM",
        band_value: row.band_value,
        band_name: row.band_name as string,
        band_duplex: row.band_duplex ?? null,
        station_id: row.station_sid,
        operator_mnc: row.operator_mnc,
        latitude: row.latitude,
        longitude: row.longitude,
        notes: row.notes,
        city: row.city ?? null,
        address: row.extra_address ?? row.address ?? null,
        e_gsm: row.gsm_e_gsm ?? null,
        region_code: row.region_code ?? null,
      },
      format as ClfFormat,
    );
    if (line) clfLines.push(line);
  }

  for (const row of umtsRows) {
    const line = convertToCLF(
      {
        cid: row.umts_cid ?? 0,
        lac: row.umts_lac,
        rnc: row.umts_rnc,
        cid_long: row.umts_cid_long,
        arfcn: row.umts_arfcn ?? null,
        rat: "UMTS",
        band_value: row.band_value,
        band_name: row.band_name as string,
        band_duplex: row.band_duplex ?? null,
        station_id: row.station_sid,
        operator_mnc: row.operator_mnc,
        latitude: row.latitude,
        longitude: row.longitude,
        notes: row.notes,
        city: row.city ?? null,
        address: row.extra_address ?? row.address ?? null,
        region_code: row.region_code ?? null,
      },
      format as ClfFormat,
    );
    if (line) clfLines.push(line);
  }

  for (const row of lteRows) {
    const line = convertToCLF(
      {
        cid: row.lte_enbid ?? 0,
        tac: row.lte_tac,
        enbid: row.lte_enbid,
        clid: row.lte_clid,
        ecid: row.lte_ecid,
        rat: "LTE",
        band_value: row.band_value,
        band_name: row.band_name as string,
        band_duplex: row.band_duplex ?? null,
        station_id: row.station_sid,
        operator_mnc: row.operator_mnc,
        latitude: row.latitude,
        longitude: row.longitude,
        notes: row.notes,
        city: row.city ?? null,
        address: row.extra_address ?? row.address ?? null,
        region_code: row.region_code ?? null,
        nr_bands: stationNrBandsMap.get(row.station_pk),
      },
      format as ClfFormat,
    );
    if (line) clfLines.push(line);
  }

  for (const row of nrRows) {
    const line = convertToCLF(
      {
        cid: row.nr_gnbid ?? 0,
        nrtac: row.nr_nrtac,
        gnbid: row.nr_gnbid,
        clid: row.nr_clid,
        nci: row.nr_nci,
        rat: "NR",
        band_value: row.band_value,
        band_name: row.band_name as string,
        band_duplex: row.band_duplex ?? null,
        station_id: row.station_sid,
        operator_mnc: row.operator_mnc,
        latitude: row.latitude,
        longitude: row.longitude,
        notes: row.notes,
        city: row.city ?? null,
        address: row.extra_address ?? row.address ?? null,
        region_code: row.region_code ?? null,
      },
      format as ClfFormat,
    );
    if (line) clfLines.push(line);
  }

  clfLines.sort();

  const fileExtension = format === "ntm" ? "ntm" : format === "netmonitor" ? "csv" : "clf";
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Content-Disposition", `attachment; filename="cells_export_${format}.${fileExtension}"`);

  return res.send(
    Readable.from(
      (function* () {
        for (const line of clfLines) yield line + "\n";
      })(),
    ),
  );
}

const getCellsExport: Route<ReqQuery, string> = {
  url: "/cells/export",
  method: "GET",
  config: { permissions: ["read:cells"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getCellsExport;
