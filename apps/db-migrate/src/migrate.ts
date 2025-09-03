import { loadLegacyData } from "./executors/loaders.js";
import { prepareBands, prepareCells, prepareLocations, prepareOperators, prepareRegions, prepareStations } from "./executors/transformers.js";
import {
	writeBands,
	writeCells,
	writeLocations,
	writeOperators,
	writeRatDetails,
	writeRegions,
	writeStations,
	updateOperatorParents,
	sql,
} from "./executors/writers.js";
import cliProgress from "cli-progress";

export interface MigratorOptions {
	directory?: string;
	batchSize?: number;
}

export async function migrateAll(options: MigratorOptions = {}): Promise<void> {
	const baseDir = options.directory;
	if (!baseDir) throw new Error("Directory is not specified");
	const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 100;
	const legacy = loadLegacyData(baseDir);

	const regions = prepareRegions(legacy.regions);
	const operators = prepareOperators(legacy.networks);
	const locations = prepareLocations(legacy.locations, legacy.regions);
	const bandKeys = prepareBands(legacy.cells);
	const stations = prepareStations(legacy.baseStations);
	const stationsById = new Map(legacy.baseStations.map((station) => [station.id, station]));
	const cells = prepareCells(legacy.cells, stationsById);

	const totalCount =
		regions.length +
		operators.length +
		locations.length +
		bandKeys.length +
		stations.length +
		cells.length +
		// 1 detail per cell
		cells.length;

	const bar = new cliProgress.SingleBar(
		{ clearOnComplete: true, hideCursor: true, format: "{bar} {percentage}% | {value}/{total} | {step}" },
		cliProgress.Presets.shades_classic,
	);
	bar.start(totalCount || 1, 0, { step: "start" });
	const inc = (amount: number, payload?: Record<string, unknown>) => bar.increment(amount, payload);

	const regionIds = await writeRegions(regions, { batchSize, onProgress: (n) => inc(n, { step: "regions" }) });
	const operatorIds = await writeOperators(operators, { batchSize, onProgress: (n) => inc(n, { step: "operators" }) });
	await updateOperatorParents();

	const locationIds = await writeLocations(locations, regionIds, { batchSize, onProgress: (n) => inc(n, { step: "locations" }) });
	const bandIds = await writeBands(bandKeys, { batchSize, onProgress: (n) => inc(n, { step: "bands" }) });
	const stationIds = await writeStations(stations, operatorIds, locationIds, {
		batchSize,
		onProgress: (n) => inc(n, { step: "stations" }),
	});
	const cellIds = await writeCells(cells, stationIds, bandIds, { batchSize, onProgress: (n) => inc(n, { step: "cells" }) });
	await writeRatDetails(cells, cellIds, { batchSize, onProgress: (n) => inc(n, { step: "RAT details" }) });

	bar.stop();
}

export async function runMigrate(options: MigratorOptions = {}): Promise<void> {
	try {
		await migrateAll(options);
	} finally {
		await sql.end({ timeout: 5 });
	}
}
