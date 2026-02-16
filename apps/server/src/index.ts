import figlet from "figlet";
import App from "./app.js";
import { port } from "./config.js";
import { installProcessErrorHandlers, logger } from "./utils/logger.js";
import { startImportJob } from "./services/ukeImportJob.service.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

console.log(await figlet("sora"));
installProcessErrorHandlers();
const app = new App();
app.listen(port).then(() => {
  logger.info("server_started", { port });

  setInterval(() => {
    logger.info("uke_import_scheduled", { trigger: "daily" });
    startImportJob({ importStations: true, importRadiolines: true, importPermits: true });
  }, ONE_DAY_MS);
});
