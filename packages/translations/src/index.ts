import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadJson = (path: string) => {
	const fullPath = resolve(__dirname, path);
	return JSON.parse(readFileSync(fullPath, "utf8"));
};

const en = loadJson("./translations/en.json");

export const translations = {
	en,
};
