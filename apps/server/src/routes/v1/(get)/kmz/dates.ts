import type { FastifyRequest } from "fastify/types/request.js";
// oxlint-disable no-await-in-loop
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod/v4";

import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const KMZ_DIR = process.env.KMZ_OUTPUT_DIR ?? "kmz_output";

const KMZ_TYPES = ["stations", "radiolines"] as const;
const KMZ_SOURCES = ["all", "permits", "device_registry"] as const;
const DATE_DIR_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type KmzType = (typeof KMZ_TYPES)[number];
type KmzSource = (typeof KMZ_SOURCES)[number];

const schemaRoute = {
  querystring: z.object({
    type: z.enum(KMZ_TYPES),
    source: z.enum(KMZ_SOURCES).default("all"),
  }),
  response: {
    200: z.object({
      data: z.array(z.string()),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

async function hasKmzFiles(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return false;
  const entries = await readdir(dir).catch(() => [] as string[]);
  return entries.some((entry) => entry.endsWith(".kmz"));
}

async function collectAvailableDates(type: KmzType, source: KmzSource): Promise<string[]> {
  if (!existsSync(KMZ_DIR)) return [];

  const dateDirs = await readdir(KMZ_DIR).catch(() => [] as string[]);
  const matches: string[] = [];

  for (const dateEntry of dateDirs) {
    if (!DATE_DIR_REGEX.test(dateEntry)) continue;

    const typeDir = join(KMZ_DIR, dateEntry, type);
    const targetDir = source === "all" ? typeDir : join(typeDir, source);

    if (await hasKmzFiles(targetDir)) matches.push(dateEntry);
  }

  return matches.sort((a, b) => b.localeCompare(a));
}

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<string[]>>) {
  const { type, source } = req.query;
  const dates = await collectAvailableDates(type, source);

  return res.send({ data: dates });
}

const getKmzDates: Route<ReqQuery, string[]> = {
  url: "/kmz/dates",
  method: "GET",
  config: { allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getKmzDates;
