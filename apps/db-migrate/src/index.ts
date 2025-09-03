import path from "node:path";
import dotenv from "dotenv";

import { runMigrate } from "./migrate.js";

dotenv.config();

const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const dir = dirArg ? dirArg.split("=")[1] : path.join(process.cwd(), "migrations", "partial");
const batchArg = process.argv.find((a) => a.startsWith("--batch=") || a.startsWith("--batch-size="));
const batchSize = batchArg ? Number((batchArg.split("=")[1] || "").trim()) : undefined;

runMigrate({ directory: dir, batchSize }).catch((e) => {
	console.error(e);
});
