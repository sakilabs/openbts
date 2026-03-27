import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { z } from "zod/v4";

import type { FastifyRequest } from "fastify/types/request.js";
import type { FastifyReply } from "fastify";
import type { Route } from "../../../../interfaces/routes.interface.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, "../../../../workers/clfExport.worker.js");

const schemaRoute = {
  querystring: z.object({
    format: z.enum(["2.0", "2.1", "3.0-dec", "3.0-hex", "4.0", "ntm", "netmonitor"]).default("4.0"),
    operators: z
      .string()
      .optional()
      .transform((val) =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
    regions: z
      .string()
      .optional()
      .transform((val) =>
        val
          ? val
              .split(",")
              .map((code) => code.trim().toUpperCase())
              .filter((code) => code.length === 3)
          : undefined,
      ),
    rat: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const validRats = new Set(["GSM", "UMTS", "LTE", "NR", "IOT"]);
        const rats = val.split(",").filter((r) => validRats.has(r.toUpperCase()));
        return rats.length > 0 ? (rats.map((r) => r.toUpperCase()) as ("GSM" | "UMTS" | "LTE" | "NR" | "IOT")[]) : undefined;
      }),
    bands: z
      .string()
      .optional()
      .transform((val) =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
  }),
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

async function handler(req: FastifyRequest<ReqQuery>, res: FastifyReply) {
  const { format, operators: operatorMncs, regions: regionCodes, rat, bands: bandIds } = req.query;

  const { tmpPath } = await new Promise<{ tmpPath: string }>((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { execArgv: process.execArgv });
    worker.postMessage({
      format,
      operatorMncs,
      regionCodes,
      rat,
      bandIds,
    });
    worker.on("message", ({ success, tmpPath, error }: { success: boolean; tmpPath?: string; error?: string }) => {
      void worker.terminate();
      if (success && tmpPath !== undefined) resolve({ tmpPath });
      else reject(new Error(error ?? "CLF export worker failed"));
    });
    worker.on("error", (err) => {
      void worker.terminate();
      reject(err);
    });
  });

  const fileExtension = format === "ntm" ? "ntm" : format === "netmonitor" ? "csv" : "clf";
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Content-Disposition", `attachment; filename="cells_export_${format}.${fileExtension}"`);

  const stream = createReadStream(tmpPath);
  stream.on("end", () => void unlink(tmpPath).catch(() => {}));
  stream.on("error", () => void unlink(tmpPath).catch(() => {}));

  return res.send(stream);
}

const getCellsExport: Route<ReqQuery, string> = {
  url: "/cells/export",
  method: "GET",
  config: { permissions: ["read:cells"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getCellsExport;
