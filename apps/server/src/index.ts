import figlet from "figlet";
import App from "./app.js";
import { port } from "./config.js";
import { installProcessErrorHandlers, logger } from "./utils/logger.js";

console.log(await figlet("sora"));
installProcessErrorHandlers();
const app = new App();
app.listen(port).then(() => {
	logger.info("server_started", { port });
});
