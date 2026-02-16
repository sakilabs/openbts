import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import { associateStationsWithPermits } from "@openbts/uke-importer/stations";
import { cleanupDownloads } from "@openbts/uke-importer/utils";
import { pruneStationsPermits } from "./stationsPermitsAssociation.service.js";
import { logger } from "../utils/logger.js";
import redis from "../database/redis.js";

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
const REDIS_KEY = "uke:import:status";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, "..", "workers", "ukeImport.worker.js");

function makeSteps(): ImportStep[] {
  return STEP_KEYS.map((key) => ({ key, status: "pending" }));
}

async function loadJob(): Promise<ImportJobStatus> {
  const raw = await redis.get(REDIS_KEY);
  if (!raw) return { state: "idle", steps: [] };
  return JSON.parse(raw) as ImportJobStatus;
}

async function saveJob(job: ImportJobStatus): Promise<void> {
  await redis.set(REDIS_KEY, JSON.stringify(job));
}

function updateStep(job: ImportJobStatus, key: ImportStepKey, update: Partial<ImportStep>): void {
  const step = job.steps.find((s) => s.key === key);
  if (step) Object.assign(step, update);
}

function markRunning(job: ImportJobStatus, key: ImportStepKey): void {
  updateStep(job, key, { status: "running", startedAt: new Date().toISOString() });
}

function markSuccess(job: ImportJobStatus, key: ImportStepKey): void {
  updateStep(job, key, { status: "success", finishedAt: new Date().toISOString() });
}

function markSkipped(job: ImportJobStatus, key: ImportStepKey): void {
  updateStep(job, key, { status: "skipped", finishedAt: new Date().toISOString() });
}

function markError(job: ImportJobStatus, key: ImportStepKey): void {
  updateStep(job, key, { status: "error", finishedAt: new Date().toISOString() });
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

export async function getImportJobStatus(): Promise<ImportJobStatus> {
  const job = await loadJob();
  return { ...job, steps: job.steps.map((s) => ({ ...s })) };
}

export async function startImportJob(options: {
  importStations?: boolean;
  importRadiolines?: boolean;
  importPermits?: boolean;
}): Promise<ImportJobStatus> {
  const existing = await loadJob();
  if (existing.state === "running") return getImportJobStatus();

  const job: ImportJobStatus = {
    state: "running",
    startedAt: new Date().toISOString(),
    steps: makeSteps(),
  };
  await saveJob(job);

  setImmediate(() => runJob(job, options));
  return { ...job, steps: job.steps.map((s) => ({ ...s })) };
}

async function runJob(
  job: ImportJobStatus,
  options: { importStations?: boolean; importRadiolines?: boolean; importPermits?: boolean },
): Promise<void> {
  const {
    importStations: shouldImportStations = true,
    importRadiolines: shouldImportRadiolines = true,
    importPermits: shouldImportPermits = true,
  } = options;

  let stationsChanged = false;
  let permitsChanged = false;

  try {
    if (shouldImportStations) {
      markRunning(job, "stations");
      await saveJob(job);
      try {
        stationsChanged = await runInWorker("importStations");
        if (stationsChanged) markSuccess(job, "stations");
        else markSkipped(job, "stations");
        await saveJob(job);
      } catch (e) {
        markError(job, "stations");
        await saveJob(job);
        throw e;
      }
    } else {
      markSkipped(job, "stations");
      await saveJob(job);
    }

    if (shouldImportRadiolines) {
      markRunning(job, "radiolines");
      await saveJob(job);
      try {
        const radiolinesChanged = await runInWorker("importRadiolines");
        if (radiolinesChanged) markSuccess(job, "radiolines");
        else markSkipped(job, "radiolines");
        await saveJob(job);
      } catch (e) {
        markError(job, "radiolines");
        await saveJob(job);
        throw e;
      }
    } else {
      markSkipped(job, "radiolines");
      await saveJob(job);
    }

    if (shouldImportPermits) {
      markRunning(job, "permits");
      await saveJob(job);
      try {
        permitsChanged = await runInWorker("importPermitDevices");
        if (permitsChanged) markSuccess(job, "permits");
        else markSkipped(job, "permits");
        await saveJob(job);
      } catch (e) {
        markError(job, "permits");
        await saveJob(job);
        throw e;
      }
    } else {
      markSkipped(job, "permits");
      await saveJob(job);
    }

    if (stationsChanged || permitsChanged) {
      markRunning(job, "prune_associations");
      await saveJob(job);
      try {
        await pruneStationsPermits();
        markSuccess(job, "prune_associations");
        await saveJob(job);
      } catch (e) {
        markError(job, "prune_associations");
        await saveJob(job);
        throw e;
      }

      markRunning(job, "associate");
      await saveJob(job);
      try {
        await associateStationsWithPermits();
        markSuccess(job, "associate");
        await saveJob(job);
      } catch (e) {
        markError(job, "associate");
        await saveJob(job);
        throw e;
      }
    } else {
      markSkipped(job, "prune_associations");
      markSkipped(job, "associate");
      await saveJob(job);
    }

    job.state = "success";
    job.finishedAt = new Date().toISOString();
    await saveJob(job);
  } catch (e) {
    job.state = "error";
    job.finishedAt = new Date().toISOString();
    job.error = e instanceof Error ? e.message : String(e);
    await saveJob(job);
    logger.error("UKE import job failed", { error: job.error });
  } finally {
    markRunning(job, "cleanup");
    await saveJob(job);
    try {
      await cleanupDownloads();
      markSuccess(job, "cleanup");
    } catch (e) {
      markError(job, "cleanup");
      logger.error("Failed to cleanup downloads", { error: e instanceof Error ? e.message : String(e) });
    }
    await saveJob(job);
  }
}
