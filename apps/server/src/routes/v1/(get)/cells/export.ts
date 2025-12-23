import { z } from "zod/v4";
import { sql } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { convertToCLF, sortCLFLines, type ClfFormat, type CellExportData } from "../../../../utils/clf-export.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { FastifyReply } from "fastify";
import type { Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	querystring: z.object({
		format: z.enum(["2.0", "2.1", "3.0-dec", "3.0-hex", "4.0"]).default("4.0"),
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
				const validRats = ["GSM", "UMTS", "LTE", "NR", "IOT"];
				const rats = val.split(",").filter((r) => validRats.includes(r.toUpperCase()));
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
	const { format, operators: operatorIds, regions: regionCodes, rat, bands: bandIds } = req.query;

	const rows = await db.query.cells.findMany({
		where: (fields, { and, or, inArray }) => {
			const conditions = [];
			if (operatorIds && operatorIds.length > 0) {
				conditions.push(
					sql`EXISTS (
						SELECT 1 FROM stations s
						WHERE s.id = ${fields.station_id}
						AND s.operator_id = ANY(ARRAY[${sql.join(
							operatorIds.map((id) => sql`${id}`),
							sql`,`,
						)}]::int4[])
					)`,
				);
			}
			if (regionCodes && regionCodes.length > 0) {
				conditions.push(
					sql`EXISTS (
					SELECT 1 FROM stations s
					JOIN locations l ON s.location_id = l.id
					JOIN regions r ON l.region_id = r.id
					WHERE s.id = ${fields.station_id}
					AND r.code = ANY(ARRAY[${sql.join(
						regionCodes.map((code) => sql`${code}`),
						sql`,`,
					)}]::text[])
				)`,
				);
			}
			if (rat && rat.length > 0) {
				const ratConditions = [];
				const standardRats = rat.filter((r) => r !== "IOT") as ("GSM" | "UMTS" | "LTE" | "NR")[];
				if (standardRats.length > 0) ratConditions.push(inArray(fields.rat, standardRats));
				if (rat.includes("IOT")) {
					ratConditions.push(
						sql`EXISTS (
							SELECT 1 FROM lte_cells lc
							WHERE lc.cell_id = ${fields.id}
							AND lc.supports_nb_iot = true
						)`,
						sql`EXISTS (
							SELECT 1 FROM nr_cells nc
							WHERE nc.cell_id = ${fields.id}
							AND nc.supports_nr_redcap = true
						)`,
					);
				}
				if (ratConditions.length > 0) {
					conditions.push(or(...ratConditions));
				}
			}
			if (bandIds && bandIds.length > 0) conditions.push(inArray(fields.band_id, bandIds));

			return conditions.length ? and(...conditions) : undefined;
		},
		with: {
			station: {
				with: {
					operator: true,
					location: { columns: { point: false } },
				},
			},
			band: true,
			gsm: true,
			umts: true,
			lte: true,
			nr: true,
		},
	});

	const clfLines: string[] = [];

	for (const row of rows) {
		const cellData: CellExportData = {
			cid: row.gsm?.cid ?? row.umts?.cid ?? row.lte?.enbid ?? row.nr?.gnbid ?? 0,
			lac: row.gsm?.lac ?? row.umts?.lac,
			tac: row.lte?.tac,
			nrtac: row.nr?.nrtac,
			rnc: row.umts?.rnc,
			cid_long: row.umts?.cid_long,
			enbid: row.lte?.enbid,
			clid: row.lte?.clid ?? row.nr?.clid,
			ecid: row.lte?.ecid,
			gnbid: row.nr?.gnbid,
			nci: row.nr?.nci,
			rat: row.rat,
			band_value: row.band.value,
			band_name: row.band.name,
			station_id: row.station.station_id,
			operator_mnc: row.station.operator?.mnc,
			latitude: row.station.location?.latitude,
			longitude: row.station.location?.longitude,
			notes: row.notes,
		};

		const clfLine = convertToCLF(cellData, format as ClfFormat);
		if (clfLine) clfLines.push(clfLine);
	}

	const sortedLines = sortCLFLines(clfLines);

	res.header("Content-Type", "text/plain; charset=utf-8");
	res.header("Content-Disposition", `attachment; filename="cells_export_${format}.clf"`);

	return res.send(sortedLines.join("\n"));
}

const getCellsExport: Route<ReqQuery, string> = {
	url: "/cells/export",
	method: "GET",
	config: { permissions: ["read:cells"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getCellsExport;
