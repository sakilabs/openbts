import { z } from "zod/v4";
import { and, or, inArray, sql } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { type cells, locations, lteCells, nrCells, regions, stations } from "@openbts/drizzle";
import { convertToCLF, sortCLFLines, type ClfFormat, type CellExportData } from "../../../../utils/clf-export.js";

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

	const buildCellConditions = (fields: typeof cells) => {
		const conditions = [];
		if (resolvedOperatorIds && resolvedOperatorIds.length > 0) {
			conditions.push(
				sql`EXISTS (
					SELECT 1 FROM ${stations}
					WHERE ${stations.id} = ${fields.station_id}
					AND ${stations.operator_id} = ANY(ARRAY[${sql.join(
						resolvedOperatorIds.map((id) => sql`${id}`),
						sql`,`,
					)}]::int4[])
				)`,
			);
		}
		if (regionCodes && regionCodes.length > 0) {
			conditions.push(
				sql`EXISTS (
				SELECT 1 FROM ${stations}
				JOIN ${locations} ON ${stations.location_id} = ${locations.id}
				JOIN ${regions} ON ${locations.region_id} = ${regions.id}
				WHERE ${stations.id} = ${fields.station_id}
				AND ${regions.code} = ANY(ARRAY[${sql.join(
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
						SELECT 1 FROM ${lteCells}
						WHERE ${lteCells.cell_id} = ${fields.id}
						AND ${lteCells.supports_nb_iot} = true
					)`,
					sql`EXISTS (
						SELECT 1 FROM ${nrCells}
						WHERE ${nrCells.cell_id} = ${fields.id}
						AND ${nrCells.supports_nr_redcap} = true
					)`,
				);
			}
			if (ratConditions.length > 0) {
				conditions.push(or(...ratConditions));
			}
		}
		if (bandIds && bandIds.length > 0) conditions.push(inArray(fields.band_id, bandIds));

		return conditions;
	};

	const rows = await db.query.cells.findMany({
		where: {
			RAW: (fields) => {
				const conds = buildCellConditions(fields);
				return and(...conds) ?? sql`true`;
			},
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
			rat: row.rat as "GSM" | "CDMA" | "UMTS" | "LTE" | "NR",
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

	const fileExtension = format === "ntm" ? "ntm" : format === "netmonitor" ? "csv" : "clf";
	res.header("Content-Type", "text/plain; charset=utf-8");
	res.header("Content-Disposition", `attachment; filename="cells_export_${format}.${fileExtension}"`);

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
