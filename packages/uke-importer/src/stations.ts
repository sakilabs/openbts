import path from "node:path";
import url from "node:url";
import { inArray } from "drizzle-orm";

import { ukePermits, stations, stationsPermits, type ratEnum } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, REGION_BY_TERYT_PREFIX, STATIONS_URL } from "./config.js";
import { chunk, convertDMSToDD, downloadFile, ensureDownloadDir, parseExcelDate, readSheetAsJson, stripCompanySuffixForName } from "./utils.js";
import { isDataUpToDate, recordImportMetadata } from "./import-check.js";
import { scrapeXlsxLinks } from "./scrape.js";
import { upsertBands, upsertOperators, upsertRegions, upsertUkeLocations } from "./upserts.js";
import { db } from "@openbts/drizzle/db";

import type { RawUkeData } from "./types.js";

function parseBandFromLabel(label: string): { rat: (typeof ratEnum.enumValues)[number]; value: number } | null {
	const firstToken = (label.trim().toLowerCase().split(/\s|-/)[0] ?? "").trim();
	if (!firstToken) return null;
	const m = firstToken.match(/^(gsm|umts|lte|5g)(\d{3,4})$/i);
	if (!m) return null;
	const tech = m[1]?.toLowerCase() ?? "";
	const bandStr = m[2] ?? "";
	const value = Number(bandStr);
	if (!Number.isFinite(value)) return null;
	const rat = tech === "gsm" ? ("GSM" as const) : tech === "umts" ? ("UMTS" as const) : tech === "lte" ? ("LTE" as const) : ("NR" as const);
	return { rat, value };
}

async function insertUkePermits(
	raws: RawUkeData[],
	bandMap: Map<string, number>,
	operatorIdByName: Map<string, number>,
	locationIdByLonLat: Map<string, number>,
	labelToBandKey: (label: string) => { rat: (typeof ratEnum.enumValues)[number]; value: number } | null,
	fileLabel: string,
): Promise<void> {
	const bandKey = labelToBandKey(fileLabel);
	if (!bandKey) return;
	const bandId = bandMap.get(`${bandKey.rat}:${bandKey.value}`);
	if (!bandId) return;
	const values = raws
		.map((r) => {
			const lon = convertDMSToDD(r["Dł geogr stacji"]) ?? null;
			const lat = convertDMSToDD(r["Szer geogr stacji"]) ?? null;
			if (!lon || !lat) return null;
			const permitDate = parseExcelDate(r["Data ważności"]) ?? new Date();
			const opName = stripCompanySuffixForName(String(r["Nazwa Operatora"] || "").trim());
			const operator_id = operatorIdByName.get(opName) ?? null;
			if (!operator_id) return null;
			const locationKey = `${lon}:${lat}`;
			const location_id = locationIdByLonLat.get(locationKey) ?? null;
			if (!location_id) return null;
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
		if (group.length) await db.insert(ukePermits).values(group);
	}
}

export async function importStations(): Promise<boolean> {
	console.log("[stations] Starting stations import...");
	console.log("[stations] Scraping file links from:", STATIONS_URL);
	const unfiltered = await scrapeXlsxLinks(STATIONS_URL);
	const links = unfiltered.filter((l) => !l.text.toLowerCase().includes("gsm-r"));
	console.log(`[stations] Found ${links.length} files to process`);

	if (await isDataUpToDate("stations", links)) {
		console.log("[stations] Data is up-to-date, skipping import");
		return false;
	}
	ensureDownloadDir();
	console.log("[stations] Parsing band information from file labels...");
	const bandKeys: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }> = [];
	for (const l of links) {
		const parsed = parseBandFromLabel(l.text || l.href);
		if (parsed) bandKeys.push(parsed);
	}
	console.log(`[stations] Found ${bandKeys.length} bands:`, bandKeys.map((b) => `${b.rat}${b.value}`).join(", "));
	const bandMap = await upsertBands(bandKeys);
	console.log("[stations] Upserting regions...");
	const regionItems = Object.values(REGION_BY_TERYT_PREFIX);
	const regionIds = await upsertRegions(regionItems);

	const operatorNamesSet = new Set<string>();
	const locationItems: Array<{ regionName: string; city: string | null; address: string | null; lon: number; lat: number }> = [];
	const fileRows: Array<{ label: string; rows: RawUkeData[] }> = [];

	for (const l of links) {
		const fileName = `${(l.text || path.basename(new url.URL(l.href).pathname)).replace(/\s+/g, "_").replace("_plik_XLSX", "")}.xlsx`;
		const filePath = path.join(DOWNLOAD_DIR, fileName);
		console.log(`[stations] Downloading: ${fileName}`);
		await downloadFile(l.href, filePath);
		const rows = readSheetAsJson<RawUkeData>(filePath);
		console.log(`[stations] Read ${rows.length} rows`);
		fileRows.push({ label: fileName, rows });
		for (const r of rows) {
			const fullOp = String(r["Nazwa Operatora"] || "").trim();
			if (fullOp) operatorNamesSet.add(fullOp);
			const teryt = String(r.TERYT || "");
			const prefix = teryt.slice(0, 2);
			const region = REGION_BY_TERYT_PREFIX[prefix];
			const lon = convertDMSToDD(r["Dł geogr stacji"]);
			const lat = convertDMSToDD(r["Szer geogr stacji"]);
			if (region && lon != null && lat != null)
				locationItems.push({ regionName: region.name, city: r.Miejscowość || null, address: r.Lokalizacja || null, lon, lat });
		}
	}
	console.log(`[stations] Found ${operatorNamesSet.size} unique operators`);
	console.log(`[stations] Found ${locationItems.length} locations`);
	console.log("[stations] Upserting operators...");
	const operatorIdByName = await upsertOperators(Array.from(operatorNamesSet));
	console.log("[stations] Upserting locations...");
	const locationIdByLonLat = await upsertUkeLocations(locationItems, regionIds);

	console.log("[stations] Inserting permits...");
	for (const fr of fileRows) {
		console.log(`[stations] Processing: ${fr.label} (${fr.rows.length} rows)`);
		await insertUkePermits(fr.rows, bandMap, operatorIdByName, locationIdByLonLat, parseBandFromLabel, fr.label);
	}

	await recordImportMetadata("stations", links, "success");
	console.log("[stations] Import completed successfully");
	return true;
}

export async function associateStationsWithPermits(): Promise<boolean> {
	console.log("[stations] Associating stations with permits...");
	const permits = await db.query.ukePermits.findMany({
		columns: { id: true, station_id: true },
	});
	console.log(`[stations] Found ${permits.length} permits`);
	if (!permits.length) {
		console.log("[stations] No permits found, skipping association");
		await recordImportMetadata("stations_permits", [], "success");
		return false;
	}

	const permitStationIds = [...new Set(permits.map((p) => p.station_id))];
	console.log(`[stations] Looking for ${permitStationIds.length} unique station IDs`);
	const matchingStations = await db.query.stations.findMany({
		where: inArray(stations.station_id, permitStationIds),
		columns: { id: true, station_id: true },
	});
	console.log(`[stations] Found ${matchingStations.length} matching stations`);
	if (!matchingStations.length) {
		console.log("[stations] No matching stations found, skipping association");
		await recordImportMetadata("stations_permits", [], "success");
		return false;
	}

	const stationIdMap = new Map<string, number>();
	for (const s of matchingStations) {
		stationIdMap.set(s.station_id, s.id);
	}

	const associations: Array<{ permit_id: number; station_id: number }> = [];
	for (const permit of permits) {
		const internalStationId = stationIdMap.get(permit.station_id);
		if (internalStationId != null) associations.push({ permit_id: permit.id, station_id: internalStationId });
	}
	console.log(`[stations] Creating ${associations.length} associations`);
	if (!associations.length) {
		console.log("[stations] No associations to create");
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
	console.log("[stations] Association completed successfully");
	return true;
}
