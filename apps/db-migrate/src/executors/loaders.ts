import path from "node:path";
import { sqlParser } from "../classes/parser.js";
import type { LegacyBaseStationRow, LegacyCellRow, LegacyLocationRow, LegacyNetworkRow, LegacyRegionRow } from "../legacyTypes.js";

export interface LegacyData {
	regions: LegacyRegionRow[];
	networks: LegacyNetworkRow[];
	locations: LegacyLocationRow[];
	baseStations: LegacyBaseStationRow[];
	cells: LegacyCellRow[];
}

function mapRows<T extends object>(columns: string[], values: (string | number | null)[][]): T[] {
	return values.map((row) => {
		const out: Record<string, unknown> = {};
		columns.forEach((col, i) => {
			out[col] = row[i];
		});
		return out as T;
	});
}

function readSingleFile<T extends object>(dir: string, name: string): T[] {
	const file = path.join(dir, `${name}.sql`);
	const inserts = sqlParser.parseSQLFile(file);
	const first = inserts.find((insert) => insert.table.toLowerCase().includes(name));
	if (!first) return [];
	return mapRows<T>(first.columns, first.values);
}

export function loadLegacyData(partialDir: string): LegacyData {
	const regions = readSingleFile<LegacyRegionRow>(partialDir, "bts_region");
	const networks = readSingleFile<LegacyNetworkRow>(partialDir, "bts_network");
	const locations = readSingleFile<LegacyLocationRow>(partialDir, "bts_location");
	const baseStations = readSingleFile<LegacyBaseStationRow>(partialDir, "bts_basestation");
	const cells = readSingleFile<LegacyCellRow>(partialDir, "bts_cell");

	return {
		regions,
		networks,
		locations,
		baseStations,
		cells,
	};
}
