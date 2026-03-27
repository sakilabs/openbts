import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import figlet from "figlet";
import App from "./app.js";
import { port } from "./config.js";
import { installProcessErrorHandlers, logger } from "./utils/logger.js";
import { startImportJob } from "./services/ukeImportJob.service.js";
import { cleanupOrphanedSubmissions } from "./services/submissionCleanup.service.js";

const workerCount = Number(process.env.WORKERS) || availableParallelism();

function scheduleDailyImport() {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(24, 0, 0, 0);
  const delay = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    logger.info("uke_import_scheduled", { trigger: "daily" });
    void startImportJob({ importStations: true, importRadiolines: false, importPermits: true });
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

  scheduleDailyImport();
  scheduleSubmissionCleanup();
} else {
  installProcessErrorHandlers();
  const workerPort = Number(process.env.WORKER_PORT) || port;
  const app = new App();
  void app.listen(workerPort).then(() => {
    logger.info("worker_started", { pid: process.pid, port: workerPort });
  });
}
