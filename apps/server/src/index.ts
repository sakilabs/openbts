import figlet from "figlet";
import cluster from "node:cluster";
import { availableParallelism } from "node:os";

import App from "./app.js";
import { port } from "./config.js";
import redis from "./database/redis.js";
import { cleanupOrphanedSubmissions } from "./services/submissionCleanup.service.js";
import { startImportJob } from "./services/ukeImportJob.service.js";
import { installProcessErrorHandlers, logger } from "./utils/logger.js";

const workerCount = Number(process.env.WORKERS) || availableParallelism();

const SCHEDULER_LOCK_KEY = "scheduler:leader";
const SCHEDULER_LOCK_TTL = 30;

async function tryAcquireSchedulerLock(): Promise<boolean> {
  const acquired = await redis.set(SCHEDULER_LOCK_KEY, process.env.HOSTNAME ?? process.pid.toString(), {
    expiration: { type: "EX", value: SCHEDULER_LOCK_TTL },
    condition: "NX",
  });
  return !!acquired;
}

async function renewSchedulerLock(): Promise<boolean> {
  const holder = await redis.get(SCHEDULER_LOCK_KEY);
  const identity = process.env.HOSTNAME ?? process.pid.toString();
  if (holder !== identity) return false;
  await redis.expire(SCHEDULER_LOCK_KEY, SCHEDULER_LOCK_TTL);
  return true;
}

async function runAsScheduler() {
  const renewInterval = setInterval(
    async () => {
      const renewed = await renewSchedulerLock().catch(() => false);
      if (!renewed) {
        clearInterval(renewInterval);
        logger.info("scheduler_lock_lost", { msg: "Lost scheduler leadership, will retry" });
        setTimeout(() => void tryBecomeScheduler(), SCHEDULER_LOCK_TTL * 1000);
      }
    },
    (SCHEDULER_LOCK_TTL / 2) * 1000,
  );

  scheduleDailyImport();
  scheduleSubmissionCleanup();
}

async function tryBecomeScheduler() {
  const isLeader = await tryAcquireSchedulerLock().catch(() => false);
  if (isLeader) {
    logger.info("scheduler_leader_elected", { identity: process.env.HOSTNAME ?? process.pid.toString() });
    await runAsScheduler();
  } else {
    setTimeout(() => void tryBecomeScheduler(), SCHEDULER_LOCK_TTL * 1000);
  }
}

function scheduleDailyImport() {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(24, 0, 0, 0);
  const delay = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    logger.info("uke_import_scheduled", { trigger: "daily" });
    void startImportJob({ importPermits: true, importRadiolines: false, importDeviceRegistry: true });
    scheduleDailyImport();
  }, delay);
}

function scheduleSubmissionCleanup() {
  setTimeout(
    async function run() {
      await cleanupOrphanedSubmissions().catch((e) => logger.error("Failed to cleanup orphaned submissions", { error: e }));
      setTimeout(run, 5 * 60 * 1000);
    },
    5 * 60 * 1000,
  );
}

if (cluster.isPrimary) {
  console.log(await figlet("sora"));
  installProcessErrorHandlers();
  logger.info("primary_started", { pid: process.pid, workers: workerCount });

  const workerPorts = new Map<number, string>();
  for (let i = 0; i < workerCount; i++) {
    const workerPort = String(port + 1 + i);
    const w = cluster.fork({ WORKER_PORT: workerPort });
    workerPorts.set(w.id, workerPort);
  }

  cluster.on("exit", (worker, code) => {
    logger.warn("worker_exit", { pid: worker.process.pid, code });
    const workerPort = workerPorts.get(worker.id) ?? String(port + 1);
    workerPorts.delete(worker.id);
    const w = cluster.fork({ WORKER_PORT: workerPort });
    workerPorts.set(w.id, workerPort);
  });

  void tryBecomeScheduler();
} else {
  installProcessErrorHandlers();
  const workerPort = Number(process.env.WORKER_PORT) || port;
  const app = new App();
  void app.listen(workerPort).then(() => {
    logger.info("worker_started", { pid: process.pid, port: workerPort });
  });
}
