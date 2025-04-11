import figlet from "figlet";
import App from "./server/app.js";
import { port } from "./server/config.js";

console.log(await figlet("sora"));
const app = new App();
app.listen(port);
