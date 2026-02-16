import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import figlet from "figlet";
import App from "./app.js";
import { port } from "./config.js";
import { installProcessErrorHandlers, logger } from "./utils/logger.js";
import { startImportJob } from "./services/ukeImportJob.service.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const workerCount = Number(process.env.WORKERS) || availableParallelism();

if (cluster.isPrimary) {
  console.log(await figlet("sora"));
  installProcessErrorHandlers();
  logger.info("primary_started", { pid: process.pid, workers: workerCount });

  for (let i = 0; i < workerCount; i++) cluster.fork();

  cluster.on("exit", (worker, code) => {
    logger.warn("worker_exit", { pid: worker.process.pid, code });
    cluster.fork();
  });

  setInterval(() => {
    logger.info("uke_import_scheduled", { trigger: "daily" });
    startImportJob({ importStations: true, importRadiolines: true, importPermits: true });
  }, ONE_DAY_MS);
} else {
  installProcessErrorHandlers();
  const app = new App();
  app.listen(port).then(() => {
    logger.info("worker_started", { pid: process.pid, port });
  });
}
