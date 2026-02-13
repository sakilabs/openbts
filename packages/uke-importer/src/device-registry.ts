import path from "node:path";
import url from "node:url";
import { unlinkSync } from "node:fs";
import readline from "node:readline";
import { inArray } from "drizzle-orm";
import XLSX from "xlsx";

import { ukePermits, operators, type ratEnum } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, REGION_BY_TERYT_PREFIX, PERMITS_DEVICES_URL, PERMIT_FILE_OPERATOR_MAP } from "./config.ts";
import { chunk, convertDMSToDD, downloadFile, ensureDownloadDir, createLogger } from "./utils.ts";

const logger = createLogger("device-registry");
import { isDataUpToDate, recordImportMetadata } from "./import-check.ts";
import { scrapePermitDeviceLinks } from "./scrape.ts";
import { upsertBands, upsertRegions, upsertUkeLocations } from "./upserts.ts";
import { findVoivodeshipByTeryt } from "./voivodeship-lookup.ts";
import { db } from "@openbts/drizzle/db";

function getRegionByTeryt(teryt: string): { name: string; code: string } | null {
	return REGION_BY_TERYT_PREFIX[teryt] ?? null;
}

function parseBandFromSystemType(systemType: string | null): { rat: (typeof ratEnum.enumValues)[number]; value: number } | null {
	if (!systemType || typeof systemType !== "string") return null;
	const normalized = systemType.trim().toUpperCase();
	const m = normalized.match(/^(GSM|UMTS|LTE|5G|IOT)(\d{3,4})$/);
	if (!m) return null;
	const tech = m[1] ?? "";
	let value = Number(m[2] ?? "");
	if (!Number.isFinite(value)) return null;
	if (tech === "5G" && value === 3600) value = 3500;
	const rat =
		tech === "GSM"
			? ("GSM" as const)
			: tech === "UMTS"
				? ("UMTS" as const)
				: tech === "LTE"
					? ("LTE" as const)
					: tech === "5G"
						? ("NR" as const)
						: tech === "IOT"
							? ("IOT" as const)
							: null;

	if (!rat) return null;
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
	logger.log(`Reading file for ${operatorKey}`);

	const wb = XLSX.readFile(filePath, { dense: true });
	const sheetName = wb.SheetNames[1];
	if (!sheetName) {
		logger.warn(`No second sheet found in ${operatorKey}`);
		return { rowCount: 0, insertedCount: 0 };
	}

	const ws = wb.Sheets[sheetName];
	if (!ws) return { rowCount: 0, insertedCount: 0 };
	logger.log("Streaming data...");

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
				logger.error(`Could not find required columns in header row of ${operatorKey}`);
				return { rowCount: 0, insertedCount: 0 };
			}
			rowCount++;
			continue;
		}

		if (!cols) continue;

		rowCount++;
		const cells = parseCSVLine(line);
		if (cells.every((cell) => !cell || cell.trim() === "")) continue;

		const lon = parseLongLat(cells[cols.dlGeogr] ?? null, "E");
		const lat = parseLongLat(cells[cols.szerGeogr] ?? null, "N");
		if (!lon || !lat) {
			logger.warn(`Invalid coordinates in row ${rowCount} for operator ${operatorKey}`);
			continue;
		}

		const stationId = (cells[cols.idStacji] ?? "").trim();
		if (!stationId) {
			logger.warn(`Missing station ID in row ${rowCount} for operator ${operatorKey}`);
			continue;
		}

		const bandInfo = parseBandFromSystemType(cells[cols.rodzajSystemuKomorki] ?? null);
		if (!bandInfo) {
			logger.warn(`Could not parse band from system type "${cells[cols.rodzajSystemuKomorki] ?? ""}" for station ${stationId}`);
			continue;
		}

		const bandKey = `${bandInfo.rat}:${bandInfo.value}:commercial`;
		fileBandKeys.add(bandKey);

		const terytCode = findVoivodeshipByTeryt(lon, lat);
		if (!terytCode) {
			logger.warn(`Could not determine region from GPS coordinates (${lon}, ${lat}) for station ${stationId}`);
			continue;
		}

		const regionInfo = getRegionByTeryt(terytCode);
		if (!regionInfo) {
			logger.warn(`Could not find region mapping for teryt code "${terytCode}" for station ${stationId}`);
			continue;
		}
		const regionName = regionInfo.name;

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

	logger.log(`Done: ${rowCount - 1} data rows, ${insertedCount} permits inserted`);
	return { rowCount: rowCount - 1, insertedCount };
}

async function processChunk(rows: ParsedRow[], operatorId: number, regionIds: Map<string, number>, fileBandKeys: Set<string>): Promise<number> {
	const bandKeysArray: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number; variant: "commercial" | "railway" }> = [];
	for (const key of fileBandKeys) {
		const [rat, valueStr, variant] = key.split(":");
		const value = Number(valueStr);
		if (rat && Number.isFinite(value) && variant)
			bandKeysArray.push({ rat: rat as (typeof ratEnum.enumValues)[number], value, variant: variant as "commercial" | "railway" });
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
			if (!location_id) {
				logger.log("Missing location_id for key:", locationKey);
				return null;
			}

			const bandId = bandMap.get(r.bandKey);
			if (!bandId) {
				logger.log("Missing bandId for key:", r.bandKey);
				return null;
			}

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
		.filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined);

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
						ukePermits.expiry_date,
					],
				});
			insertedCount += group.length;
		}
	}

	return insertedCount;
}

export async function importPermitDevices(): Promise<boolean> {
	logger.log("Starting import from device registry...");
	logger.log("Scraping file links from:", PERMITS_DEVICES_URL);
	const links = await scrapePermitDeviceLinks(PERMITS_DEVICES_URL);
	logger.log(`Found ${links.length} files:`, links.map((l) => l.operatorKey).join(", "));

	const linksForCheck = links.map((l) => ({ href: l.href, text: l.text }));
	if (await isDataUpToDate("permits", linksForCheck)) {
		logger.log("Data is up-to-date, skipping import");
		return false;
	}

	ensureDownloadDir();

	logger.log("Looking up operators...");
	const operatorNamesNeeded = links.map((l) => PERMIT_FILE_OPERATOR_MAP[l.operatorKey]).filter((n): n is string => n !== null && n !== undefined);

	const operatorIds = new Map<string, number>();
	if (operatorNamesNeeded.length > 0) {
		const existingOperators = await db.query.operators.findMany({
			where: inArray(operators.name, operatorNamesNeeded),
		});
		for (const op of existingOperators) {
			operatorIds.set(op.name, op.id);
		}
		logger.log(`Found ${operatorIds.size}/${operatorNamesNeeded.length} operators in database`);
	}

	logger.log("Upserting regions...");
	const regionItems = Object.values(REGION_BY_TERYT_PREFIX);
	const regionIds = await upsertRegions(regionItems);

	logger.log("Downloading all files...");
	const downloadedFiles: Array<{ filePath: string; operatorKey: string; operatorId: number }> = [];

	for (const l of links) {
		const operatorName = PERMIT_FILE_OPERATOR_MAP[l.operatorKey];
		if (!operatorName) {
			logger.warn(`Unknown operator key: ${l.operatorKey}`);
			continue;
		}

		const operatorId = operatorIds.get(operatorName);
		if (!operatorId) {
			logger.warn(`Operator not found in database: ${operatorName}`);
			continue;
		}

		const fileName = `${(l.text || path.basename(new url.URL(l.href).pathname)).replace(/\s+/g, "_").replace("_plik_XLSX", "")}.xlsx`;
		const filePath = path.join(DOWNLOAD_DIR, fileName);

		logger.log(`Downloading: ${fileName}`);
		await downloadFile(l.href, filePath);

		downloadedFiles.push({ filePath, operatorKey: l.operatorKey, operatorId });
	}

	logger.log(`Downloaded ${downloadedFiles.length} files`);

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
				logger.log(`Deleted: ${path.basename(filePath)}`);
			} catch {}
		}
	}

	logger.log(`Total: ${totalRows} rows processed, ${totalInserted} records inserted`);
	await recordImportMetadata("permits", linksForCheck, "success");
	logger.log("Import completed successfully");
	return true;
}
