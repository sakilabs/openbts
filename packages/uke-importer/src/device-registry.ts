import path from "node:path";
import url from "node:url";
import { unlinkSync } from "node:fs";
import readline from "node:readline";
import { inArray } from "drizzle-orm";
import XLSX from "xlsx";

import { ukePermits, operators, type ratEnum } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, REGION_BY_TERYT_PREFIX, PERMITS_DEVICES_URL, PERMIT_FILE_OPERATOR_MAP } from "./config.ts";
import { chunk, convertDMSToDD, downloadFile, ensureDownloadDir } from "./utils.ts";
import { isDataUpToDate, recordImportMetadata } from "./import-check.ts";
import { scrapePermitDeviceLinks } from "./scrape.ts";
import { upsertBands, upsertRegions, upsertUkeLocations } from "./upserts.ts";
import { db } from "@openbts/drizzle/db";

function parseBandFromSystemType(systemType: string | null): { rat: (typeof ratEnum.enumValues)[number]; value: number } | null {
	if (!systemType || typeof systemType !== "string") return null;

	const normalized = systemType.trim().toUpperCase();
	const m = normalized.match(/^(GSM|UMTS|LTE|5G|NR)(\d{3,4})$/);
	if (!m) return null;

	const tech = m[1] ?? "";
	let value = Number(m[2] ?? "");
	if (!Number.isFinite(value)) return null;

	if ((tech === "5G" || tech === "NR") && value === 3600) value = 3500;
	const rat = tech === "GSM" ? ("GSM" as const) : tech === "UMTS" ? ("UMTS" as const) : tech === "LTE" ? ("LTE" as const) : ("NR" as const);

	return { rat, value };
}

function parseLongLat(val: string | null, direction: "N" | "E"): number | null {
	if (!val) return null;
	const str = val.trim();
	if (!str || str.length !== 6) return null;
	// 205840 -> 20°58'40" E -> "20E58'40''"
	const deg = str.slice(0, 2);
	const min = str.slice(2, 4);
	const sec = str.slice(4, 6);
	const dms = `${deg}${direction}${min}'${sec}''`;
	return convertDMSToDD(dms);
}

function extractRegionFromGUS(gusCode: string | null): string | null {
	if (!gusCode) return null;
	const prefix = gusCode.trim().slice(0, 2);
	return REGION_BY_TERYT_PREFIX[prefix]?.name ?? null;
}

interface ColumnIndices {
	nrAlternatywny: number;
	rodzajWniosku: number;
	idStacji: number;
	miejscowosc: number;
	ulica: number;
	nrDomu: number;
	dodatkowyOpis: number;
	dlGeogr: number;
	szerGeogr: number;
	kodGUS: number;
	rodzajSystemuKomorki: number;
}

function findColumnIndices(headerCells: string[]): ColumnIndices | null {
	const indices: Partial<ColumnIndices> = {};

	for (let i = 0; i < headerCells.length; i++) {
		const h = (headerCells[i] ?? "").trim().toLowerCase();
		switch (h) {
			case "nr alternatywny":
				if (indices.nrAlternatywny === undefined) indices.nrAlternatywny = i;
				break;
			case "rodzaj wniosku":
				indices.rodzajWniosku = i;
				break;
			case "id stacji":
				indices.idStacji = i;
				break;
			case "miejscowość":
			case "miejscowosc":
				indices.miejscowosc = i;
				break;
			case "ulica":
				indices.ulica = i;
				break;
			case "nr domu":
				indices.nrDomu = i;
				break;
			case "dodatkowy opis lokalizacji":
				indices.dodatkowyOpis = i;
				break;
			case "dł geogr.":
			case "dl geogr.":
			case "dł geogr":
			case "dl geogr":
				indices.dlGeogr = i;
				break;
			case "szer. geogr.":
			case "szer geogr.":
			case "szer. geogr":
			case "szer geogr":
				indices.szerGeogr = i;
				break;
			case "kod gus":
				indices.kodGUS = i;
				break;
			case "rodzaj systemu komórki":
			case "rodzaj systemu komorki":
				indices.rodzajSystemuKomorki = i;
				break;
		}
	}

	if (
		indices.nrAlternatywny === undefined ||
		indices.idStacji === undefined ||
		indices.dlGeogr === undefined ||
		indices.szerGeogr === undefined ||
		indices.rodzajSystemuKomorki === undefined
	) {
		return null;
	}

	return indices as ColumnIndices;
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (inQuotes) {
			if (char === '"' && nextChar === '"') {
				current += '"';
				i++;
			} else if (char === '"') inQuotes = false;
			else current += char;
		} else {
			if (char === '"') inQuotes = true;
			else if (char === ",") {
				result.push(current);
				current = "";
			} else current += char;
		}
	}
	result.push(current);
	return result;
}

interface ParsedRow {
	stationId: string;
	lon: number;
	lat: number;
	regionName: string;
	city: string | null;
	address: string | null;
	decisionNumber: string;
	decisionType: "P" | "zmP";
	bandKey: string;
	bandInfo: { rat: (typeof ratEnum.enumValues)[number]; value: number };
}

async function processOperatorFile(
	filePath: string,
	operatorKey: string,
	operatorId: number,
	regionIds: Map<string, number>,
): Promise<{ rowCount: number; insertedCount: number }> {
	console.log(`[device-registry] Reading file for ${operatorKey}`);

	const wb = XLSX.readFile(filePath, { dense: true });
	const sheetName = wb.SheetNames[1];
	if (!sheetName) {
		console.warn(`[device-registry] No second sheet found in ${operatorKey}`);
		return { rowCount: 0, insertedCount: 0 };
	}

	const ws = wb.Sheets[sheetName];
	if (!ws) return { rowCount: 0, insertedCount: 0 };
	console.log("[device-registry] Streaming data...");

	const csvStream = XLSX.stream.to_csv(ws);
	const rl = readline.createInterface({ input: csvStream, crlfDelay: Number.POSITIVE_INFINITY });

	let rowCount = 0;
	let insertedCount = 0;
	let cols: ColumnIndices | null = null;
	let chunkRows: ParsedRow[] = [];
	const fileBandKeys = new Set<string>();
	const CHUNK_SIZE = 1000;

	for await (const line of rl) {
		if (rowCount === 0) {
			const headerCells = parseCSVLine(line);
			cols = findColumnIndices(headerCells);
			if (!cols) {
				console.error(`[device-registry] Could not find required columns in header row of ${operatorKey}`);
				return { rowCount: 0, insertedCount: 0 };
			}
			rowCount++;
			continue;
		}

		if (!cols) continue;

		rowCount++;
		const cells = parseCSVLine(line);

		const lon = parseLongLat(cells[cols.dlGeogr] ?? null, "E");
		const lat = parseLongLat(cells[cols.szerGeogr] ?? null, "N");
		if (!lon || !lat) continue;

		const stationId = (cells[cols.idStacji] ?? "").trim();
		if (!stationId) continue;

		const bandInfo = parseBandFromSystemType(cells[cols.rodzajSystemuKomorki] ?? null);
		if (!bandInfo) continue;

		const bandKey = `${bandInfo.rat}:${bandInfo.value}`;
		fileBandKeys.add(bandKey);

		const regionName = extractRegionFromGUS(cells[cols.kodGUS] ?? null);
		if (!regionName) continue;

		const addressParts: string[] = [];
		const ulica = cells[cols.ulica];
		const nrDomu = cells[cols.nrDomu];
		const dodatkowyOpis = cells[cols.dodatkowyOpis];
		if (ulica) addressParts.push(ulica.trim());
		if (nrDomu) addressParts.push(nrDomu.trim());
		if (dodatkowyOpis) addressParts.push(dodatkowyOpis.trim());

		chunkRows.push({
			stationId,
			lon,
			lat,
			regionName,
			city: cells[cols.miejscowosc]?.trim() ?? null,
			address: addressParts.length > 0 ? addressParts.join(" ") : null,
			decisionNumber: (cells[cols.nrAlternatywny] ?? "").trim(),
			decisionType: (cells[cols.rodzajWniosku] ?? "").trim().toUpperCase() === "M" ? "zmP" : "P",
			bandKey,
			bandInfo,
		});

		if (chunkRows.length >= CHUNK_SIZE) {
			const inserted = await processChunk(chunkRows, operatorId, regionIds, fileBandKeys);
			insertedCount += inserted;

			chunkRows = [];
		}
	}

	if (chunkRows.length > 0) {
		const inserted = await processChunk(chunkRows, operatorId, regionIds, fileBandKeys);
		insertedCount += inserted;
	}

	console.log(`[device-registry] Done: ${rowCount - 1} data rows, ${insertedCount} permits inserted`);
	return { rowCount: rowCount - 1, insertedCount };
}

async function processChunk(rows: ParsedRow[], operatorId: number, regionIds: Map<string, number>, fileBandKeys: Set<string>): Promise<number> {
	const bandKeysArray: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }> = [];
	for (const key of fileBandKeys) {
		const [rat, valueStr] = key.split(":");
		const value = Number(valueStr);
		if (rat && Number.isFinite(value)) {
			bandKeysArray.push({ rat: rat as (typeof ratEnum.enumValues)[number], value });
		}
	}
	const bandMap = await upsertBands(bandKeysArray);

	const locationItems = rows.map((r) => ({
		regionName: r.regionName,
		city: r.city,
		address: r.address,
		lon: r.lon,
		lat: r.lat,
	}));
	const locationIdByLonLat = await upsertUkeLocations(locationItems, regionIds);

	const values = rows
		.map((r) => {
			const locationKey = `${r.lon}:${r.lat}`;
			const location_id = locationIdByLonLat.get(locationKey);
			if (!location_id) return null;

			const bandId = bandMap.get(r.bandKey);
			if (!bandId) return null;

			return {
				station_id: r.stationId,
				operator_id: operatorId,
				location_id,
				decision_number: r.decisionNumber,
				decision_type: r.decisionType,
				expiry_date: new Date("2099-12-31T23:59:59Z"),
				band_id: bandId,
			};
		})
		.filter((v): v is NonNullable<typeof v> => v != null);

	let insertedCount = 0;
	for (const group of chunk(values, BATCH_SIZE)) {
		if (group.length) {
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
					],
				});
			insertedCount += group.length;
		}
	}

	return insertedCount;
}

export async function importPermitDevices(): Promise<boolean> {
	console.log("[device-registry] Starting import from device registry...");
	console.log("[device-registry] Scraping file links from:", PERMITS_DEVICES_URL);
	const links = await scrapePermitDeviceLinks(PERMITS_DEVICES_URL);
	console.log(`[device-registry] Found ${links.length} files:`, links.map((l) => l.operatorKey).join(", "));

	const linksForCheck = links.map((l) => ({ href: l.href, text: l.text }));
	if (await isDataUpToDate("permits", linksForCheck)) {
		console.log("[device-registry] Data is up-to-date, skipping import");
		return false;
	}

	ensureDownloadDir();

	console.log("[device-registry] Looking up operators...");
	const operatorNamesNeeded = links.map((l) => PERMIT_FILE_OPERATOR_MAP[l.operatorKey]).filter((n): n is string => n != null);

	const operatorIds = new Map<string, number>();
	if (operatorNamesNeeded.length > 0) {
		const existingOperators = await db.query.operators.findMany({
			where: inArray(operators.name, operatorNamesNeeded),
		});
		for (const op of existingOperators) {
			operatorIds.set(op.name, op.id);
		}
		console.log(`[device-registry] Found ${operatorIds.size}/${operatorNamesNeeded.length} operators in database`);
	}

	console.log("[device-registry] Upserting regions...");
	const regionItems = Object.values(REGION_BY_TERYT_PREFIX);
	const regionIds = await upsertRegions(regionItems);

	console.log("[device-registry] Downloading all files...");
	const downloadedFiles: Array<{ filePath: string; operatorKey: string; operatorId: number }> = [];

	for (const l of links) {
		const operatorName = PERMIT_FILE_OPERATOR_MAP[l.operatorKey];
		if (!operatorName) {
			console.warn(`[device-registry] Unknown operator key: ${l.operatorKey}`);
			continue;
		}

		const operatorId = operatorIds.get(operatorName);
		if (!operatorId) {
			console.warn(`[device-registry] Operator not found in database: ${operatorName}`);
			continue;
		}

		const fileName = `${(l.text || path.basename(new url.URL(l.href).pathname)).replace(/\s+/g, "_").replace("_plik_XLSX", "")}.xlsx`;
		const filePath = path.join(DOWNLOAD_DIR, fileName);

		console.log(`[device-registry] Downloading: ${fileName}`);
		await downloadFile(l.href, filePath);

		downloadedFiles.push({ filePath, operatorKey: l.operatorKey, operatorId });
	}

	console.log(`[device-registry] Downloaded ${downloadedFiles.length} files`);

	let totalRows = 0;
	let totalInserted = 0;

	for (const { filePath, operatorKey, operatorId } of downloadedFiles) {
		try {
			const result = await processOperatorFile(filePath, operatorKey, operatorId, regionIds);
			totalRows += result.rowCount;
			totalInserted += result.insertedCount;
		} finally {
			try {
				unlinkSync(filePath);
				console.log(`[device-registry] Deleted: ${path.basename(filePath)}`);
			} catch {}
		}
	}

	console.log(`[device-registry] Total: ${totalRows} rows processed, ${totalInserted} records inserted`);
	await recordImportMetadata("permits", linksForCheck, "success");
	console.log("[device-registry] Import completed successfully");
	return true;
}
