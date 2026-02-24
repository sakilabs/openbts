import { z } from "zod/v4";

import { startImportJob } from "../../../../services/ukeImportJob.service.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

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
  body: z.object({
    importStations: z.boolean().optional().default(true),
    importRadiolines: z.boolean().optional().default(true),
    importPermits: z.boolean().optional().default(true),
  }),
  response: {
    200: z.object({
      data: importJobStatusSchema,
    }),
  },
};

type ReqBody = {
  Body: z.infer<typeof schemaRoute.body>;
};

type ResponseData = z.infer<typeof importJobStatusSchema>;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const status = await startImportJob(req.body);
  await createAuditLog(
    {
      action: "uke_import.start",
      table_name: "uke_import",
      source: "import",
      metadata: { config: req.body, status: status.state },
    },
    req,
  );
  res.send({ data: status });
}

const importUkeData: Route<ReqBody, ResponseData> = {
  url: "/uke/import",
  method: "POST",
  schema: schemaRoute,
  config: {
    permissions: ["write:uke_permits", "write:uke_radiolines"],
    allowGuestAccess: false,
  },
  handler,
};

export default importUkeData;
