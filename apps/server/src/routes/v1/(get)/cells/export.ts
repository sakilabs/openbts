import { bands, cells, locations, regions, stations } from "@openbts/drizzle";
import { and, eq, gte, inArray, max } from "drizzle-orm";
import type { FastifyReply } from "fastify";
import type { FastifyRequest } from "fastify/types/request.js";
// oxlint-disable no-await-in-loop
import { createReadStream, existsSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import redis from "../../../../database/redis.js";
import type { Route } from "../../../../interfaces/routes.interface.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, "../../../../workers/clfExport.worker.js");

const CACHE_TTL = 3600; // 1h
const CLF_TMP_DIR = join(tmpdir(), "clf-exports");
const NETWORKS_MNC = 26034;
const NETWORKS_CHILD_MNCS = [26002, 26003];

async function cleanupOldExports() {
  try {
    if (!existsSync(CLF_TMP_DIR)) return;
    const files = await readdir(CLF_TMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = join(CLF_TMP_DIR, file);
      const fileStat = await stat(filePath).catch(() => null);
      if (fileStat && now - fileStat.mtimeMs > CACHE_TTL * 1000) await unlink(filePath).catch(() => {});
    }
  } catch {}
}

setInterval(cleanupOldExports, CACHE_TTL * 1000);

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
    since: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

async function getLastModified({
  operatorMncs,
  regionCodes,
  rat,
  bandIds,
  since,
}: {
  operatorMncs?: number[];
  regionCodes?: string[];
  rat?: ("GSM" | "UMTS" | "LTE" | "NR" | "IOT")[];
  bandIds?: number[];
  since?: string;
}): Promise<Date | null> {
  let resolvedOperatorIds: number[] | undefined;
  if (operatorMncs && operatorMncs.length > 0) {
    const mncs = new Set(operatorMncs);
    if (mncs.has(NETWORKS_MNC)) for (const child of NETWORKS_CHILD_MNCS) mncs.add(child);
    const matched = await db.query.operators.findMany({ where: { mnc: { in: [...mncs] } }, columns: { id: true } });
    resolvedOperatorIds = matched.map((o) => o.id);
  }

  const conditions = [];
  if (resolvedOperatorIds && resolvedOperatorIds.length > 0) conditions.push(inArray(stations.operator_id, resolvedOperatorIds));
  if (regionCodes && regionCodes.length > 0) conditions.push(inArray(regions.code, regionCodes));
  if (bandIds && bandIds.length > 0) conditions.push(inArray(bands.value, bandIds));
  if (since) conditions.push(gte(cells.updatedAt, new Date(since)));
  if (rat && rat.length > 0) {
    const ratSet = new Set(rat);
    const dbRats: ("GSM" | "UMTS" | "LTE" | "NR" | "IOT")[] = [];
    if (ratSet.has("GSM")) dbRats.push("GSM");
    if (ratSet.has("UMTS")) dbRats.push("UMTS");
    if (ratSet.has("LTE") || ratSet.has("IOT")) dbRats.push("LTE");
    if (ratSet.has("NR") || ratSet.has("IOT")) dbRats.push("NR");
    conditions.push(inArray(cells.rat, dbRats));
  }

  const [result] = await db
    .select({ lastModified: max(cells.updatedAt) })
    .from(cells)
    .innerJoin(stations, eq(cells.station_id, stations.id))
    .innerJoin(bands, and(eq(cells.band_id, bands.id), eq(bands.variant, "commercial")))
    .leftJoin(locations, eq(stations.location_id, locations.id))
    .leftJoin(regions, eq(locations.region_id, regions.id))
    .where(and(...conditions));

  return result?.lastModified ?? null;
}

async function handler(req: FastifyRequest<ReqQuery>, res: FastifyReply) {
  const { format, operators: operatorMncs, regions: regionCodes, rat, bands: bandIds, since } = req.query;
  const cacheKey = `clf:export:${JSON.stringify({ format, operatorMncs, regionCodes, rat, bandIds, since })}`;
  const lastModifiedKey = `${cacheKey}:lm`;

  const lastModified = await getLastModified({ operatorMncs, regionCodes, rat, bandIds, since });
  const lastModifiedIso = lastModified?.toISOString() ?? null;
  const [cachedLm, cachedTmpPath] = await Promise.all([redis.get(lastModifiedKey), redis.get(cacheKey)]);

  let tmpPath = cachedTmpPath && existsSync(cachedTmpPath) && cachedLm === lastModifiedIso ? cachedTmpPath : null;

  if (!tmpPath) {
    tmpPath = await new Promise<string>((resolve, reject) => {
      const worker = new Worker(WORKER_PATH, { execArgv: process.execArgv });
      worker.postMessage({
        format,
        operatorMncs,
        regionCodes,
        rat,
        bandIds,
        since,
      });
      worker.on("message", ({ success, tmpPath, error }: { success: boolean; tmpPath?: string; error?: string }) => {
        void worker.terminate();
        if (success && tmpPath !== undefined) resolve(tmpPath);
        else reject(new Error(error ?? "CLF export worker failed"));
      });
      worker.on("error", (err) => {
        void worker.terminate();
        reject(err);
      });
    });

    await Promise.all([
      redis.setEx(cacheKey, CACHE_TTL, tmpPath),
      lastModifiedIso !== null ? redis.setEx(lastModifiedKey, CACHE_TTL, lastModifiedIso) : Promise.resolve(),
    ]);
  }

  const fileExtension = format === "ntm" ? "ntm" : format === "netmonitor" ? "csv" : "clf";
  const { size } = await stat(tmpPath);
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Content-Length", size);
  if (lastModified !== null) res.header("Last-Modified", lastModified.toUTCString());
  res.header("Content-Disposition", `attachment; filename="cells_export_${format}.${fileExtension}"`);

  return res.send(createReadStream(tmpPath));
}

const getCellsExport: Route<ReqQuery, string> = {
  url: "/cells/export",
  method: "GET",
  config: { permissions: ["read:cells"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getCellsExport;
