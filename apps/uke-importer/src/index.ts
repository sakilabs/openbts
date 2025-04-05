import { read, utils } from "xlsx";
import path from "node:path";
import { eq } from "drizzle-orm";

import { ukePermits, bands } from "@openbts/drizzle";

import type { WorkBook, WorkSheet } from "xlsx";
import type { NewUkePermission } from "@openbts/drizzle/types";
import type { db } from "../../server/src/server/database/psql.js";

interface RawUkeData {
	"Nazwa Operatora": string;
	"Nr Decyzji": string;
	"Rodzaj decyzji": "zmP" | "P";
	"Data ważności": string;
	"Dł geogr stacji": string;
	"Szer geogr stacji": string;
	Miejscowość: string;
	Lokalizacja: string;
	IdStacji: string;
	TERYT: string;
}

interface NetworkInfo {
	type: string;
	frequency: number;
}

function parseDMS(dms: string): number {
	const match = dms.match(/(\d+)([EW])(\d+)'(\d+)"/);
	if (!match) throw new Error(`Invalid DMS format: ${dms}`);

	const [, degrees, direction, minutes, seconds] = match;
	let decimal = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;

	if (direction === "W") decimal = -decimal;

	return Number(decimal.toFixed(6));
}

function parseNetworkInfo(filename: string): NetworkInfo {
	const parts = filename.split(" - ");
	if (!parts[0]) throw new Error('Invalid filename format. Expected format: "networkType - ..."');

	const networkTypePart = parts[0];
	const match = networkTypePart.match(/^(5g|lte|cdma|umts|gsm)(\d+)$/i);
	if (!match || !match[1] || !match[2]) throw new Error(`Invalid network type format in filename: ${networkTypePart}`);

	const type = match[1];
	const frequency = Number.parseInt(match[2], 10);

	return {
		type: type.toLowerCase(),
		frequency,
	};
}

async function findBandByValue(db: db, value: number) {
	const band = await db.query.bands.findFirst({
		where: eq(bands.value, value),
	});

	if (!band) throw new Error(`No band found for frequency value: ${value}`);

	return band;
}

export function parseUkeXlsx(filePath: string, bandId: number): NewUkePermission[] {
	const workbook: WorkBook = read(filePath);
	const sheets = workbook.Sheets as Record<string, WorkSheet>;
	const firstSheetName = workbook.SheetNames[0];
	if (!firstSheetName) throw new Error("No worksheets found in the XLSX file");
	const worksheet = sheets[firstSheetName];

	if (!worksheet) throw new Error("No worksheet found in the XLSX file");

	const jsonData = utils.sheet_to_json<RawUkeData>(worksheet);

	const fileName = path.basename(filePath);
	const { type: networkType } = parseNetworkInfo(fileName);

	return jsonData.map((row: RawUkeData): NewUkePermission => {
		const expiryDate = new Date(row["Data ważności"]);

		const longitude = parseDMS(row["Dł geogr stacji"]);
		const latitude = parseDMS(row["Szer geogr stacji"]);

		return {
			operator_name: row["Nazwa Operatora"],
			decision_number: row["Nr Decyzji"],
			decision_type: row["Rodzaj decyzji"],
			expiry_date: expiryDate,
			longitude,
			latitude,
			city: row.Miejscowość,
			location: row.Lokalizacja,
			station_id: row.IdStacji,
			band_id: bandId,
			last_updated: new Date(),
			date_created: new Date(),
		};
	});
}

export async function importUkeData(filePath: string, db: db) {
	try {
		const { frequency } = parseNetworkInfo(path.basename(filePath));

		const band = await findBandByValue(db, frequency);
		console.log(`Found band: ${band.name} (${band.value}MHz) for frequency ${frequency}`);

		const permissions = parseUkeXlsx(filePath, band.id);

		const BATCH_SIZE = 100;
		for (let i = 0; i < permissions.length; i += BATCH_SIZE) {
			const batch = permissions.slice(i, i + BATCH_SIZE);
			await db.insert(ukePermits).values(batch);
		}

		return {
			success: true,
			count: permissions.length,
			message: `Successfully imported ${permissions.length} UKE permissions`,
		};
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return {
			success: false,
			count: 0,
			message: `Failed to import UKE permissions: ${errorMessage}`,
			error,
		};
	}
}
