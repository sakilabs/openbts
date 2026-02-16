import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";

const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;

const logsDir = path.join(process.cwd(), "logs");
mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, `migrate-${timestamp}.log`);
const stream = createWriteStream(logFile, { flags: "a" });

function write(level: string, args: unknown[]) {
  const msg = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  stream.write(`${new Date().toISOString()} [${level}] ${msg}\n`);
}

export const logger = {
  log(...args: unknown[]) {
    console.log(...args);
    write("INFO", args);
  },
  warn(...args: unknown[]) {
    console.warn(...args);
    write("WARN", args);
  },
  error(...args: unknown[]) {
    console.error(...args);
    write("ERROR", args);
  },
  end() {
    stream.end();
  },
};
