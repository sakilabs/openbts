import figlet from "figlet";
import App from "./app.js";
import { port } from "./config.js";

console.log(await figlet("sora"));
const app = new App();
app.listen(port);
