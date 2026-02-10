import { loadLegacyData } from "./executors/loaders.js";
import { logger } from "./logger.js";
import { prepareBands, prepareCells, prepareLocations, prepareStations } from "./executors/transformers.js";
import {
	fetchRegionIds,
	fetchBandIds,
	pruneTables,
	writeBands,
	writeCellsAndDetails,
	writeLocations,
	writeStations,
	sql,
	db,
} from "./executors/writers.js";
import cliProgress from "cli-progress";

export interface MigratorOptions {
	directory?: string;
	batchSize?: number;
}

export async function migrateAll(options: MigratorOptions = {}): Promise<void> {
	const baseDir = options.directory;
	if (!baseDir) throw new Error("Directory is not specified");
	const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 1000;

	logger.log("Pruning existing data (locations, stations, cells)...");
	await pruneTables();

	const [regionIds, operatorRows, existingBandIds] = await Promise.all([fetchRegionIds(), db.query.operators.findMany(), fetchBandIds()]);

	const operatorIds = new Map<number, number>();
	const mncToOperatorName = new Map<number, string>();
	for (const row of operatorRows) {
		if (row.mnc != null) {
			operatorIds.set(row.mnc, row.id);
			mncToOperatorName.set(row.mnc, row.name);
		}
	}

	logger.log("Loading legacy data from SQL files...");
	const legacy = loadLegacyData(baseDir);

	logger.log("Transforming data...");
	const preparedLocations = prepareLocations(legacy.locations);
	const bandKeys = prepareBands(legacy.cells);
	const preparedStations = prepareStations(legacy.baseStations, mncToOperatorName);
	const stationsById = new Map(legacy.baseStations.map((station) => [station.id, station]));
	const preparedCells = prepareCells(legacy.cells, stationsById);

	const totalSteps = preparedLocations.length + bandKeys.length + preparedStations.length + preparedCells.length;
	const bar = new cliProgress.SingleBar(
		{ hideCursor: true, format: " {bar} {percentage}% | {value}/{total} | {step}" },
		cliProgress.Presets.shades_classic,
	);
	const startTime = Date.now();
	let globalProcessed = 0;
	bar.start(totalSteps, 0, { step: "locations" });

	const inc = (n: number, step?: string) => {
		globalProcessed += n;
		bar.update(globalProcessed, step ? { step } : undefined);
	};

	logger.log("Writing data to the database...");
	const locationIds = await writeLocations(preparedLocations, regionIds, { batchSize, onProgress: (n) => inc(n, "locations") });

	logger.log("Resolving and writing bands...");
	const bandIds = await writeBands(bandKeys, { batchSize, onProgress: (n) => inc(n, "bands") });
	for (const [key, id] of existingBandIds) {
		if (!bandIds.has(key)) bandIds.set(key, id);
	}

	logger.log("Writing stations...");
	const stationIds = await writeStations(preparedStations, operatorIds, locationIds, { batchSize, onProgress: (n) => inc(n, "stations") });

	logger.log("Writing cells and details...");
	await writeCellsAndDetails(preparedCells, stationIds, bandIds, {
		batchSize,
		onProgress: (n) => inc(n, "cells"),
	});

	bar.update(totalSteps, { step: "done" });
	bar.stop();
	const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
	logger.log(`Migration completed in ${elapsed}s`);
}

export async function runMigrate(options: MigratorOptions = {}): Promise<void> {
	try {
		await migrateAll(options);
	} finally {
		logger.end();
		await sql.end({ timeout: 5 });
	}
}
