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
	const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 500;
	const legacy = loadLegacyData(baseDir);

	const regions = prepareRegions(legacy.regions);
	const operators = prepareOperators(legacy.networks);
	const locations = prepareLocations(legacy.locations, legacy.regions);
	const bandKeys = prepareBands(legacy.cells);
	const stations = prepareStations(legacy.baseStations);
	const stationsById = new Map(legacy.baseStations.map((station) => [station.id, station]));
	const cells = prepareCells(legacy.cells, stationsById);

	const bar = new cliProgress.SingleBar(
		{ hideCursor: true, format: "{bar} {percentage}% | {value}/{total} | {step}" },
		cliProgress.Presets.shades_classic,
	);
	bar.start(1, 0, { step: "start" });

	let processed = 0;
	let currentStep = "start";
	const setTotal = (t: number) => (bar as unknown as { setTotal?: (t: number) => void }).setTotal?.(t || 1);
	const beginStep = (step: string, total: number) => {
		currentStep = step;
		processed = 0;
		setTotal(total || 1);
		bar.update(0, { step });
	};
	const inc = (amount: number) => {
		processed += amount;
		bar.update(processed, { step: currentStep });
	};

	beginStep("regions", regions.length);
	const regionIds = await writeRegions(regions, { batchSize, onProgress: (n) => inc(n) });

	beginStep("operators", operators.length);
	const operatorIds = await writeOperators(operators, { batchSize, onProgress: (n) => inc(n) });
	await updateOperatorParents();

	beginStep("locations", locations.length);
	const locationIds = await writeLocations(locations, regionIds, { batchSize, onProgress: (n) => inc(n) });

	beginStep("bands", bandKeys.length);
	const bandIds = await writeBands(bandKeys, { batchSize, onProgress: (n) => inc(n) });

	beginStep("stations", stations.length);
	const stationIds = await writeStations(stations, operatorIds, locationIds, { batchSize, onProgress: (n) => inc(n) });

	beginStep("cells", cells.length);
	const cellIds = await writeCells(cells, stationIds, bandIds, { batchSize, onProgress: (n) => inc(n) });

	beginStep("RAT details", cells.length);
	await writeRatDetails(cells, cellIds, { batchSize, onProgress: (n) => inc(n) });

	bar.stop();
}

export async function runMigrate(options: MigratorOptions = {}): Promise<void> {
	try {
		await migrateAll(options);
	} finally {
		await sql.end({ timeout: 5 });
	}
}
