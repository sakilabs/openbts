import * as schema from "@btsfinder/drizzle";
import { bands, cells, locations, operators, regions, stations } from "@btsfinder/drizzle";
import cliProgress from "cli-progress";
import { config } from "dotenv";
import { and, eq, isNull } from "drizzle-orm";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import fs from "node:fs/promises";
import Papa from "papaparse";
import postgres from "postgres";

import { convertDMSToDD, determineOperatorFromRow } from "./utils/index.js";

import type { CsvRow, LocationData, OperatorRow } from "./interfaces/csv.js";

config();

async function processOperator(db: PostgresJsDatabase<typeof schema>, row: OperatorRow) {
	const operatorInfo = determineOperatorFromRow(row);

	let parentId = null;
	if (operatorInfo.parent) {
		const [parent] = await db
			.insert(operators)
			.values({
				name: operatorInfo.parent,
				mnc_code: operatorInfo.parentMnc || 0,
			})
			.onConflictDoNothing()
			.returning();

		if (parent) {
			parentId = parent.id;
		} else {
			const existing = await db.select().from(operators).where(eq(operators.name, operatorInfo.parent)).limit(1);
			parentId = existing[0]?.id;
		}
	}

	const [operator] = await db
		.insert(operators)
		.values({
			name: operatorInfo.name,
			parent_id: parentId,
			mnc_code: operatorInfo.mnc || 0,
		})
		.onConflictDoNothing()
		.returning();

	if (operator) {
		return operator;
	}

	const [existing] = await db.select().from(operators).where(eq(operators.name, operatorInfo.name)).limit(1);

	return existing;
}

async function processRegion(db: PostgresJsDatabase<typeof schema>, name: string) {
	const existingRegion = await db.select().from(regions).where(eq(regions.name, name)).limit(1);

	if (existingRegion.length) {
		return existingRegion[0];
	}

	const [newRegion] = await db.insert(regions).values({ name }).returning();

	return newRegion;
}

async function processLocation(db: PostgresJsDatabase<typeof schema>, data: LocationData, regionId: number) {
	const existingLocation = await db.select().from(locations).where(eq(locations.address, data.lokalizacja)).limit(1);

	if (existingLocation.length) {
		return existingLocation[0];
	}

	const [newLocation] = await db
		.insert(locations)
		.values({
			// @ts-expect-error: Type mismatch
			region_id: regionId,
			city: data.miejscowosc,
			address: data.lokalizacja,
			longitude: convertDMSToDD(data.LONGuke),
			latitude: convertDMSToDD(data.LATIuke),
		})
		.returning();

	return newLocation;
}

async function collectAndProcessBands(db: PostgresJsDatabase<typeof schema>, data: CsvRow[], progress: cliProgress.SingleBar) {
	const uniqueBands = new Map<string, { value: number | null; duplex: string | null }>();

	// Collect unique bands with their properties
	for (const row of data) {
		const value = row.pasmo ? Number.parseInt(row.pasmo) : null;
		const key = value === null ? `null-${row.duplex || "null"}` : value.toString();

		// Skip if we already have this combination
		if (!uniqueBands.has(key)) {
			uniqueBands.set(key, {
				value: value === null || Number.isNaN(value) ? null : value,
				duplex: row.duplex || null,
			});
		}
	}

	const processedBands = new Map();

	for (const [key, bandData] of uniqueBands) {
		const [band] = await db
			.insert(bands)
			.values({
				value: bandData.value,
				name: bandData.value ? `B${bandData.value}` : `Unknown${bandData.duplex ? `-${bandData.duplex}` : ""}`,
				frequency: bandData.value ? `${bandData.value}MHz` : null,
				duplex: bandData.duplex,
			})
			.onConflictDoNothing()
			.returning();

		if (band) {
			processedBands.set(key, band);
		} else {
			const [existing] = await db
				.select()
				.from(bands)
				.where(
					bandData.value
						? eq(bands.value, bandData.value)
						: and(isNull(bands.value), bandData.duplex ? eq(bands.duplex, bandData.duplex) : isNull(bands.duplex)),
				)
				.limit(1);
			processedBands.set(key, existing);
		}
		progress.increment();
	}

	return {
		get: (value: number | null, duplex: string | null) => {
			const key = value === null ? `null-${duplex || "null"}` : value.toString();
			return processedBands.get(key);
		},
	};
}

function parseIntSafe(value: string | null | undefined): number | null {
	if (!value) return null;
	const num = Number.parseInt(value);
	return Number.isNaN(num) ? null : num;
}

async function updateStationFlags(db: PostgresJsDatabase<typeof schema>, stationId: number, standard: string) {
	const flagMapping: Record<string, keyof typeof stations.$inferSelect> = {
		GSM: "is_gsm",
		UMTS: "is_umts",
		LTE: "is_lte",
		"5G": "is_5g",
		CDMA: "is_cdma",
	};

	const flag = flagMapping[standard.toUpperCase()];
	if (flag) {
		await db
			.update(stations)
			.set({ [flag]: true })
			.where(eq(stations.id, stationId));
	}
}

async function main() {
	const sql = postgres(process.env.DATABASE_URL as string);
	const db = drizzle({
		client: sql,
		schema,
	});

	const multibar = new cliProgress.MultiBar(
		{
			clearOnComplete: false,
			hideCursor: true,
			format: "{bar} | {percentage}% | {value}/{total} | {status}",
		},
		cliProgress.Presets.shades_classic,
	);

	try {
		console.log("Reading CSV file...");
		const csvContent = await fs.readFile("btsfinder.csv", "utf-8");

		const { data } = Papa.parse<CsvRow>(csvContent, {
			header: true,
			delimiter: ";",
			skipEmptyLines: true,
		});

		const counts = {
			bands: new Set(data.map((row) => Number.parseInt(row.pasmo))).size,
			operators: new Set(data.map((row) => row.siec_id)).size,
			regions: new Set(data.map((row) => row.wojewodztwo_id)).size,
			locations: new Set(data.map((row) => `${row.miejscowosc}-${row.lokalizacja}`)).size,
			stations: new Set(data.map((row) => row.StationId)).size,
			cells: data.length,
		};

		const progress = {
			bands: multibar.create(counts.bands, 0, { status: "Bands" }),
			operators: multibar.create(counts.operators, 0, { status: "Operators" }),
			regions: multibar.create(counts.regions, 0, { status: "Regions" }),
			locations: multibar.create(counts.locations, 0, { status: "Locations" }),
			stations: multibar.create(counts.stations, 0, { status: "Stations" }),
			cells: multibar.create(counts.cells, 0, { status: "Cells" }),
		};

		console.log("Processing bands...");
		const processedBands = await collectAndProcessBands(db, data, progress.bands);

		console.log("Processing operators...");
		const processedOperators = new Map();
		for (const row of data) {
			if (!processedOperators.has(row.siec_id)) {
				const operator = await processOperator(db, row);
				processedOperators.set(row.siec_id, operator);
				progress.operators.increment();
			}
		}

		console.log("Processing regions and locations...");
		const processedRegions = new Map();
		const processedLocations = new Map();

		for (const row of data) {
			const locationKey = `${row.miejscowosc}-${row.lokalizacja}`;

			if (!processedRegions.has(row.wojewodztwo_id)) {
				const region = await processRegion(db, row.wojewodztwo_id);
				processedRegions.set(row.wojewodztwo_id, region);
				progress.regions.increment();
			}

			if (!processedLocations.has(locationKey)) {
				const region = processedRegions.get(row.wojewodztwo_id);
				const location = await processLocation(db, row, region.id);
				processedLocations.set(locationKey, location);
				progress.locations.increment();
			}
		}

		console.log("Processing stations and cells...");
		for (const row of data) {
			const locationKey = `${row.miejscowosc}-${row.lokalizacja}`;
			const operator = processedOperators.get(row.siec_id);
			const location = processedLocations.get(locationKey);
			const band = processedBands.get(parseIntSafe(row.pasmo), row.duplex || null);

			if (!operator || !location || !band) {
				throw new Error(`Missing required relation for station: ${row.StationId}`);
			}

			// Process station
			const [station] = await db
				.insert(stations)
				.values({
					station_id: row.StationId,
					bts_id: parseIntSafe(row.btsid) ?? 0,
					location_id: location.id,
					operator_id: operator.id,
					lac: parseIntSafe(row.lac),
					rnc: row.RNC,
					enbi: parseIntSafe(row.eNBI),
					notes: row.uwagi,
					last_updated: new Date(row.aktualizacja),
				})
				.onConflictDoNothing()
				.returning();

			const [existingStation] = await db.select().from(stations).where(eq(stations.station_id, row.StationId)).limit(1);
			const stationID = existingStation?.id ?? station?.id ?? null;
			if (!stationID) {
				progress.cells.increment();
				continue;
			}

			await updateStationFlags(db, stationID, row.standard);

			const clid = parseIntSafe(row.CLID) ?? 0;
			await db.insert(cells).values({
				// @ts-expect-error: Drizzle bug?
				station_id: stationID,
				standard: row.standard,
				band_id: band?.id ?? processedBands.get(null, null).id,
				config: {
					duplex: row.duplex,
					ecid: parseIntSafe(row.ECID),
					clid,
					carrier: parseIntSafe(row.carrier),
				},
				sector: clid ? clid % 100 : 0,
			});

			progress.cells.increment();
		}

		multibar.stop();
		console.log("\nMigration completed successfully!");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

main().catch(console.error);
