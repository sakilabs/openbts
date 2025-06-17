import { read, utils } from "xlsx";
import path from "node:path";
import { eq } from "drizzle-orm";

import { ukePermits, bands, operators, ukeRadioLines } from "@openbts/drizzle";

import type { WorkBook, WorkSheet } from "xlsx";
import type { NewUkePermission } from "@openbts/drizzle/types";
import type { db } from "../../server/src/server/database/psql.js";

// Define the type for new radio line entries
type NewUkeRadioLine = typeof ukeRadioLines.$inferInsert;

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

interface RawRadioLineData {
	// Transmitter station data
	"Dł geo Tx": string;
	"Sz geo Tx": string;
	"H t Tx [m npm]": number;

	// Receiver station data
	"Dł geo Rx": string;
	"Sz geo Rx": string;
	"H t Rx [m npm]": number;

	// Radio line parameters
	"F [GHz]": number;
	"Nr kan": number;
	"Symbol planu": string;
	"Szer kan [MHz]": number;
	Polaryzacja: string;
	"Rodz modulacji": string;
	"Przepływność [Mb/s]": number;

	// Transmitter parameters
	"EIRP [dBm]": number;
	"Tłum ant odb Rx [dB]": number;
	"Typ nad": string;
	"Prod nad": string;
	"Typ ant Tx": string;
	"Prod ant Tx": string;
	"Zysk ant Tx [dBi]": number;
	"H ant Tx [m npt]": number;

	// Receiver parameters
	"Typ ant Rx": string;
	"Prod ant Rx": string;
	"Zysk ant Rx [dBi]": number;
	"H ant Rx [m npt]": number;
	"Liczba szum Rx [dB]": number;
	"Tłum ATPC [dB]": number;

	// Administrative data
	Operator: string;
	"Nr pozw/dec": string;
	"Rodz dec": string;
	"Data ważn pozw/dec": string;
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

export function parseUkeXlsx(filePath: string, bandId: number, operatorId: number): NewUkePermission[] {
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
			operator_id: operatorId,
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

		// Extract operator name from filename or use a default operator ID
		// In a real implementation, you might want to parse the operator from the filename or data
		// For now, we'll use a default operator ID of 1
		const operatorId = 1; // Default operator ID

		const permissions = parseUkeXlsx(filePath, band.id, operatorId);

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

/**
 * Parses radio line data from an XLSX file according to the UKE radio line legend
 * @param filePath Path to the XLSX file containing radio line data
 * @returns Array of radio line data objects ready to be inserted into the database
 */
export function parseRadioLinesXlsx(filePath: string): NewUkeRadioLine[] {
	const workbook: WorkBook = read(filePath);
	const sheets = workbook.Sheets as Record<string, WorkSheet>;
	const firstSheetName = workbook.SheetNames[0];
	if (!firstSheetName) throw new Error("No worksheets found in the XLSX file");
	const worksheet = sheets[firstSheetName];

	if (!worksheet) throw new Error("No worksheet found in the XLSX file");

	const jsonData = utils.sheet_to_json<RawRadioLineData>(worksheet);

	return jsonData.map((row: RawRadioLineData): NewUkeRadioLine => {
		const expiryDate = new Date(row["Data ważn pozw/dec"]);

		// Parse coordinates
		const txLongitude = parseDMS(row["Dł geo Tx"]);
		const txLatitude = parseDMS(row["Sz geo Tx"]);
		const rxLongitude = parseDMS(row["Dł geo Rx"]);
		const rxLatitude = parseDMS(row["Sz geo Rx"]);

		return {
			// Transmitter station data
			tx_longitude: txLongitude, // Store as integer (microdegrees)
			tx_latitude: txLatitude,
			tx_height: row["H t Tx [m npm]"],

			// Receiver station data
			rx_longitude: rxLongitude,
			rx_latitude: rxLatitude,
			rx_height: row["H t Rx [m npm]"],

			// Radio line parameters
			freq: row["F [GHz]"] ? Math.round(row["F [GHz]"] * 1000) : 0, // Convert GHz to MHz and store as integer
			ch_num: row["Nr kan"],
			plan_symbol: row["Symbol planu"],
			ch_width: row["Szer kan [MHz]"],
			polarization: row.Polaryzacja,
			modulation_type: row["Rodz modulacji"],
			bandwidth: row["Przepływność [Mb/s]"],

			// Transmitter parameters
			tx_eirp: row["EIRP [dBm]"],
			tx_antenna_attenuation: row["Tłum ant odb Rx [dB]"],
			tx_transmitter_type: row["Typ nad"],
			tx_transmitter_manufacturer: row["Prod nad"],
			tx_antenna_type: row["Typ ant Tx"],
			tx_antenna_manufacturer: row["Prod ant Tx"],
			tx_antenna_gain: row["Zysk ant Tx [dBi]"],
			tx_antenna_height: row["H ant Tx [m npt]"],

			// Receiver parameters
			rx_antenna_type: row["Typ ant Rx"],
			rx_antenna_manufacturer: row["Prod ant Rx"],
			rx_antenna_gain: row["Zysk ant Rx [dBi]"],
			rx_antenna_height: row["H ant Rx [m npt]"],
			rx_noise_figure: row["Liczba szum Rx [dB]"],
			rx_atpc_attenuation: row["Tłum ATPC [dB]"],

			// Administrative data
			operator_name: row.Operator,
			permit_number: row["Nr pozw/dec"],
			decision_type: row["Rodz dec"],
			expiry_date: expiryDate,

			// Metadata
			last_updated: new Date(),
			date_created: new Date(),
		};
	});
}

/**
 * Imports radio line data from an XLSX file into the database
 * @param filePath Path to the XLSX file containing radio line data
 * @param db Database connection
 * @returns Result of the import operation
 */
export async function importRadioLinesData(filePath: string, db: db) {
	try {
		const radioLines = parseRadioLinesXlsx(filePath);

		// Process operator IDs if needed
		for (const radioLine of radioLines) {
			if (radioLine.operator_name) {
				// Try to find operator by name
				const operator = await db.query.operators.findFirst({
					where: eq(operators.name, radioLine.operator_name),
				});

				if (operator) {
					//radioLine.operator_id = operator.id;
				}
			}
		}

		const BATCH_SIZE = 100;
		for (let i = 0; i < radioLines.length; i += BATCH_SIZE) {
			const batch = radioLines.slice(i, i + BATCH_SIZE);
			await db.insert(ukeRadioLines).values(batch);
		}

		return {
			success: true,
			count: radioLines.length,
			message: `Successfully imported ${radioLines.length} UKE radio lines`,
		};
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return {
			success: false,
			count: 0,
			message: `Failed to import UKE radio lines: ${errorMessage}`,
			error,
		};
	}
}
