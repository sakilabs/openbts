import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import { associateStationsWithPermits } from "@openbts/uke-importer/stations";
import { cleanupDownloads } from "@openbts/uke-importer/utils";
import { pruneStationsPermits } from "./stationsPermitsAssociation.service.js";
import { logger } from "../utils/logger.js";

type ImportStepKey = "stations" | "radiolines" | "permits" | "prune_associations" | "associate" | "cleanup";
type StepStatus = "pending" | "running" | "success" | "skipped" | "error";
type JobState = "idle" | "running" | "success" | "error";

interface ImportStep {
	key: ImportStepKey;
	status: StepStatus;
	startedAt?: string;
	finishedAt?: string;
}

interface ImportJobStatus {
	state: JobState;
	startedAt?: string;
	finishedAt?: string;
	steps: ImportStep[];
	error?: string;
}

const STEP_KEYS: ImportStepKey[] = ["stations", "radiolines", "permits", "prune_associations", "associate", "cleanup"];

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, "..", "workers", "ukeImport.worker.js");

let currentJob: ImportJobStatus = { state: "idle", steps: [] };

function makeSteps(): ImportStep[] {
	return STEP_KEYS.map((key) => ({ key, status: "pending" }));
}

function updateStep(key: ImportStepKey, update: Partial<ImportStep>): void {
	const step = currentJob.steps.find((s) => s.key === key);
	if (step) Object.assign(step, update);
}

function markRunning(key: ImportStepKey): void {
	updateStep(key, { status: "running", startedAt: new Date().toISOString() });
}

function markSuccess(key: ImportStepKey): void {
	updateStep(key, { status: "success", finishedAt: new Date().toISOString() });
}

function markSkipped(key: ImportStepKey): void {
	updateStep(key, { status: "skipped", finishedAt: new Date().toISOString() });
}

function markError(key: ImportStepKey): void {
	updateStep(key, { status: "error", finishedAt: new Date().toISOString() });
}

function runInWorker(task: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(WORKER_PATH, {
			workerData: { task },
			execArgv: process.execArgv,
		});

		worker.on("message", (msg: { success: boolean; result?: boolean; error?: string }) => {
			if (msg.success) {
				resolve(msg.result ?? false);
			} else {
				reject(new Error(msg.error ?? "Worker task failed"));
			}
		});

		worker.on("error", reject);
		worker.on("exit", (code) => {
			if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
		});
	});
}

export function getImportJobStatus(): ImportJobStatus {
	return { ...currentJob, steps: currentJob.steps.map((s) => ({ ...s })) };
}

export function startImportJob(options: { importStations?: boolean; importRadiolines?: boolean; importPermits?: boolean }): ImportJobStatus {
	if (currentJob.state === "running") return getImportJobStatus();

	currentJob = {
		state: "running",
		startedAt: new Date().toISOString(),
		steps: makeSteps(),
	};

	setImmediate(() => runJob(options));
	return getImportJobStatus();
}

async function runJob(options: { importStations?: boolean; importRadiolines?: boolean; importPermits?: boolean }): Promise<void> {
	const { importStations: shouldImportStations = true, importRadiolines: shouldImportRadiolines = true, importPermits: shouldImportPermits = true } = options;

	let stationsChanged = false;
	let permitsChanged = false;

	try {
		if (shouldImportStations) {
			markRunning("stations");
			try {
				stationsChanged = await runInWorker("importStations");
				if (stationsChanged) markSuccess("stations");
				else markSkipped("stations");
			} catch (e) {
				markError("stations");
				throw e;
			}
		} else {
			markSkipped("stations");
		}

		if (shouldImportRadiolines) {
			markRunning("radiolines");
			try {
				const radiolinesChanged = await runInWorker("importRadiolines");
				if (radiolinesChanged) markSuccess("radiolines");
				else markSkipped("radiolines");
			} catch (e) {
				markError("radiolines");
				throw e;
			}
		} else {
			markSkipped("radiolines");
		}

		if (shouldImportPermits) {
			markRunning("permits");
			try {
				permitsChanged = await runInWorker("importPermitDevices");
				if (permitsChanged) markSuccess("permits");
				else markSkipped("permits");
			} catch (e) {
				markError("permits");
				throw e;
			}
		} else {
			markSkipped("permits");
		}

		if (stationsChanged || permitsChanged) {
			markRunning("prune_associations");
			try {
				await pruneStationsPermits();
				markSuccess("prune_associations");
			} catch (e) {
				markError("prune_associations");
				throw e;
			}

			markRunning("associate");
			try {
				await associateStationsWithPermits();
				markSuccess("associate");
			} catch (e) {
				markError("associate");
				throw e;
			}
		} else {
			markSkipped("prune_associations");
			markSkipped("associate");
		}

		currentJob.state = "success";
		currentJob.finishedAt = new Date().toISOString();
	} catch (e) {
		currentJob.state = "error";
		currentJob.finishedAt = new Date().toISOString();
		currentJob.error = e instanceof Error ? e.message : String(e);
		logger.error("UKE import job failed", { error: currentJob.error });
	} finally {
		markRunning("cleanup");
		try {
			await cleanupDownloads();
			markSuccess("cleanup");
		} catch (e) {
			markError("cleanup");
			logger.error("Failed to cleanup downloads", { error: e instanceof Error ? e.message : String(e) });
		}
	}
}
