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
    void startImportJob({ importStations: true, importRadiolines: true, importPermits: true });
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

  for (let i = 0; i < workerCount; i++) cluster.fork();

  cluster.on("exit", (worker, code) => {
    logger.warn("worker_exit", { pid: worker.process.pid, code });
    cluster.fork();
  });

  scheduleDailyImport();
  scheduleSubmissionCleanup();
} else {
  installProcessErrorHandlers();
  const app = new App();
  void app.listen(port).then(() => {
    logger.info("worker_started", { pid: process.pid, port });
  });
}
