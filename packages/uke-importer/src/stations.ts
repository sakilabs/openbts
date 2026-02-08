import path from "node:path";
import url from "node:url";
import { inArray } from "drizzle-orm";

import { ukePermits, stations, stationsPermits, type ratEnum, type BandVariant } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, REGION_BY_TERYT_PREFIX, STATIONS_URL } from "./config.js";
import {
	chunk,
	convertDMSToDD,
	downloadFile,
	ensureDownloadDir,
	parseExcelDate,
	readSheetAsJson,
	stripCompanySuffixForName,
	createLogger,
} from "./utils.js";

const logger = createLogger("stations");
import { isDataUpToDate, recordImportMetadata } from "./import-check.js";
import { scrapeXlsxLinks } from "./scrape.js";
import { upsertBands, getOperators, upsertRegions, upsertUkeLocations } from "./upserts.js";
import { db } from "@openbts/drizzle/db";

import type { RawUkeData } from "./types.js";

function parseBandFromLabel(
	label: string,
): { rat: (typeof ratEnum.enumValues)[number]; value: number; variant: (typeof BandVariant.enumValues)[number] } | null {
	const normalized = label.trim().toLowerCase();

	const gsmrMatch = normalized.match(/^gsm-r\s*(\d{3,4})?/);
	if (gsmrMatch) {
		const value = gsmrMatch[1] ? Number(gsmrMatch[1]) : 900;
		return { rat: "GSM", value, variant: "railway" };
	}

	const firstToken = (normalized.split(/\s|-/)[0] ?? "").trim();
	if (!firstToken) return null;
	const m = firstToken.match(/^(gsm|cdma|umts|lte|5g)(\d{3,4})$/i);
	if (!m) return null;
	const tech = m[1]?.toLowerCase() ?? "";
	const bandStr = m[2] ?? "";
	const value = Number(bandStr);
	if (!Number.isFinite(value)) return null;
	const rat =
		tech === "gsm"
			? ("GSM" as const)
			: tech === "cdma"
				? ("CDMA" as const)
				: tech === "umts"
					? ("UMTS" as const)
					: tech === "lte"
						? ("LTE" as const)
						: ("NR" as const);
	const bandValue = rat === "NR" && value === 3600 ? 3500 : value;
	return { rat, value: bandValue, variant: "commercial" };
}

async function insertUkePermits(
	raws: RawUkeData[],
	bandMap: Map<string, number>,
	operatorIdByName: Map<string, number>,
	locationIdByLonLat: Map<string, number>,
	labelToBandKey: (
		label: string,
	) => { rat: (typeof ratEnum.enumValues)[number]; value: number; variant: (typeof BandVariant.enumValues)[number] } | null,
	fileLabel: string,
): Promise<void> {
	const bandKey = labelToBandKey(fileLabel);
	if (!bandKey) {
		logger.warn(`Warning: Could not parse band from file label: ${fileLabel}`);
		return;
	}
	const bandId = bandMap.get(`${bandKey.rat}:${bandKey.value}:${bandKey.variant}`);
	if (!bandId) {
		logger.warn(`Warning: No band ID found for band ${bandKey.rat}${bandKey.value} (${bandKey.variant}) in file: ${fileLabel}`);
		return;
	}
	const values = raws
		.map((r) => {
			const lon = convertDMSToDD(r["Dł geogr stacji"]) ?? null;
			const lat = convertDMSToDD(r["Szer geogr stacji"]) ?? null;
			if (!lon || !lat) {
				logger.warn(`Warning: Invalid coordinates for station ID ${r.IdStacji} GPS(${r["Dł geogr stacji"]}, ${r["Szer geogr stacji"]})`);
				return null;
			}
			const permitDate = parseExcelDate(r["Data ważności"]) ?? new Date();
			const opName = stripCompanySuffixForName(String(r["Nazwa Operatora"] || "").trim());
			const operator_id = operatorIdByName.get(opName) ?? null;
			if (!operator_id) {
				logger.warn(`Warning: No operator ID found for operator name: ${opName} Station ID: ${r.IdStacji}`);
				return null;
			}
			const locationKey = `${lon}:${lat}`;
			const location_id = locationIdByLonLat.get(locationKey) ?? null;
			if (!location_id) {
				logger.warn(`Warning: No location ID found for coordinates GPS(${lon}, ${lat}) Station ID: ${r.IdStacji}`);
				return null;
			}
			return {
				station_id: String(r.IdStacji || "").trim(),
				operator_id,
				location_id,
				decision_number: String(r["Nr Decyzji"] || "").trim(),
				decision_type: (r["Rodzaj decyzji"] ?? "P") as "zmP" | "P",
				expiry_date: permitDate,
				band_id: bandId,
			};
		})
		.filter((v): v is NonNullable<typeof v> => v != null);
	for (const group of chunk(values, BATCH_SIZE)) {
		if (group.length)
			await db
				.insert(ukePermits)
				.values(group)
				.onConflictDoNothing({
					target: [
						ukePermits.station_id,
						ukePermits.operator_id,
						ukePermits.location_id,
						ukePermits.band_id,
						ukePermits.decision_number,
						ukePermits.decision_type,
						ukePermits.expiry_date,
					],
				});
	}
}

export async function importStations(): Promise<boolean> {
	logger.log("Starting stations import...");
	logger.log("Scraping file links from:", STATIONS_URL);
	const unfiltered = await scrapeXlsxLinks(STATIONS_URL);
	const links = unfiltered;
	logger.log(`Found ${links.length} files to process`);

	if (await isDataUpToDate("stations", links)) {
		logger.log("Data is up-to-date, skipping import");
		return false;
	}
	ensureDownloadDir();
	logger.log("Parsing band information from file labels...");
	const bandKeys: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number; variant: (typeof BandVariant.enumValues)[number] }> = [];
	for (const l of links) {
		const parsed = parseBandFromLabel(l.text || l.href);
		if (parsed) bandKeys.push(parsed);
	}
	logger.log(`Found ${bandKeys.length} bands:`, bandKeys.map((b) => `${b.rat}${b.value}${b.variant === "railway" ? " (R)" : ""}`).join(", "));
	const bandMap = await upsertBands(bandKeys);
	logger.log("Upserting regions...");
	const regionItems = Object.values(REGION_BY_TERYT_PREFIX);
	const regionIds = await upsertRegions(regionItems);

	const operatorNamesSet = new Set<string>();
	const locationItems: Array<{ regionName: string; city: string | null; address: string | null; lon: number; lat: number }> = [];
	const fileRows: Array<{ label: string; rows: RawUkeData[] }> = [];

	let totalCount = 0;
	for (const l of links) {
		const fileName = `${(l.text || path.basename(new url.URL(l.href).pathname)).replace(/\s+/g, "_").replace("_plik_XLSX", "")}.xlsx`;
		const filePath = path.join(DOWNLOAD_DIR, fileName);
		logger.log(`Downloading: ${fileName}`);
		await downloadFile(l.href, filePath);
		const rows = readSheetAsJson<RawUkeData>(filePath);
		logger.log(`Read ${rows.length} rows`);
		totalCount += rows.length;
		fileRows.push({ label: l.text, rows });
		for (const r of rows) {
			const fullOp = String(r["Nazwa Operatora"] || "").trim();
			if (fullOp) operatorNamesSet.add(fullOp);
			const teryt = String(r.TERYT || "");
			const prefix = teryt.slice(0, 2);
			const region = REGION_BY_TERYT_PREFIX[prefix];
			if (!region) {
				logger.warn(`Warning: No region found for TERYT prefix: ${prefix} (full TERYT: ${teryt})`);
				continue;
			}
			const lon = convertDMSToDD(r["Dł geogr stacji"]);
			const lat = convertDMSToDD(r["Szer geogr stacji"]);
			if (lon === null || lat === null) {
				logger.warn(`Warning: Invalid coordinates for station ID ${r.IdStacji} GPS(${r["Dł geogr stacji"]}, ${r["Szer geogr stacji"]})`);
				continue;
			}
			locationItems.push({ regionName: region.name, city: r.Miejscowość || null, address: r.Lokalizacja || null, lon, lat });
		}
	}
	logger.log(`Processed a total of ${totalCount} rows`);
	logger.log(`Found ${operatorNamesSet.size} unique operators`);
	logger.log(`Found ${locationItems.length} locations`);
	logger.log("Upserting operators...");
	const operatorIdByName = await getOperators(Array.from(operatorNamesSet));
	logger.log("Upserting locations...");
	const locationIdByLonLat = await upsertUkeLocations(locationItems, regionIds);

	logger.log("Inserting permits...");
	for (const fr of fileRows) {
		logger.log(`Processing: ${fr.label} (${fr.rows.length} rows)`);
		await insertUkePermits(fr.rows, bandMap, operatorIdByName, locationIdByLonLat, parseBandFromLabel, fr.label);
	}

	await recordImportMetadata("stations", links, "success");
	logger.log("Import completed successfully");
	return true;
}

export async function associateStationsWithPermits(): Promise<boolean> {
	logger.log("Associating stations with permits...");
	const permits = await db.query.ukePermits.findMany({
		columns: { id: true, station_id: true, operator_id: true },
	});
	logger.log(`Found ${permits.length} permits`);
	if (!permits.length) {
		logger.log("No permits found, skipping association");
		await recordImportMetadata("stations_permits", [], "success");
		return false;
	}

	const permitStationIds = [...new Set(permits.map((p) => p.station_id))];
	logger.log(`Looking for ${permitStationIds.length} unique station IDs`);
	const matchingStations = await db.query.stations.findMany({
		where: inArray(stations.station_id, permitStationIds),
		columns: { id: true, station_id: true, operator_id: true },
	});
	logger.log(`Found ${matchingStations.length} matching stations`);
	if (!matchingStations.length) {
		logger.log("No matching stations found, skipping association");
		await recordImportMetadata("stations_permits", [], "success");
		return false;
	}

	const stationsByKey = new Map<string, number>();
	for (const s of matchingStations) {
		if (s.operator_id !== null) stationsByKey.set(`${s.station_id}:${s.operator_id}`, s.id);
	}

	const associations: Array<{ permit_id: number; station_id: number }> = [];
	let skippedOperatorMismatch = 0;
	for (const permit of permits) {
		const key = `${permit.station_id}:${permit.operator_id}`;
		const internalStationId = stationsByKey.get(key);
		if (internalStationId !== undefined) associations.push({ permit_id: permit.id, station_id: internalStationId });
		else skippedOperatorMismatch++;
	}
	if (skippedOperatorMismatch > 0) logger.warn(`Skipped ${skippedOperatorMismatch} permits (no station with matching station_id + operator)`);
	logger.log(`Creating ${associations.length} associations`);
	if (!associations.length) {
		logger.log("No associations to create");
		await recordImportMetadata("stations_permits", [], "success");
		return false;
	}

	for (const group of chunk(associations, BATCH_SIZE)) {
		await db
			.insert(stationsPermits)
			.values(group)
			.onConflictDoNothing({ target: [stationsPermits.station_id, stationsPermits.permit_id] });
	}

	await recordImportMetadata("stations_permits", [], "success");
	logger.log("Association completed successfully");
	return true;
}
