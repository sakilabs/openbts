import App from "./server/app.js";
import { port } from "./server/config.js";

await App.initializeTranslations();
const app = new App();
app.listen(port);
