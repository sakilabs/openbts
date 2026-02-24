import { z } from "zod/v4";

import { getImportJobStatus } from "../../../../../services/ukeImportJob.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const importStepSchema = z.object({
  key: z.enum([
    "stations",
    "radiolines",
    "permits",
    "prune_deleted_entries",
    "prune_associations",
    "cleanup_orphaned_uke_locations",
    "associate",
    "snapshot",
    "cleanup",
  ]),
  status: z.enum(["pending", "running", "success", "skipped", "error"]),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});

const importJobStatusSchema = z.object({
  state: z.enum(["idle", "running", "success", "error"]),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  steps: z.array(importStepSchema),
  error: z.string().optional(),
});

const schemaRoute = {
  response: {
    200: z.object({
      data: importJobStatusSchema,
    }),
  },
};

type ResponseData = z.infer<typeof importJobStatusSchema>;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
  const status = await getImportJobStatus();
  res.send({ data: status });
}

const getUkeImportStatus: Route<Record<string, never>, ResponseData> = {
  url: "/uke/import/status",
  method: "GET",
  schema: schemaRoute,
  config: {
    permissions: ["write:uke_permits", "write:uke_radiolines"],
    allowGuestAccess: false,
  },
  handler,
};

export default getUkeImportStatus;
