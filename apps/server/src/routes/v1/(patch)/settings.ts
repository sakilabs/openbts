import { z } from "zod/v4";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";
import { getRuntimeSettings, updateRuntimeSettings, type RuntimeSettings } from "../../../services/settings.service.js";
import { createAuditLog } from "../../../services/auditLog.service.js";
import { ErrorResponse } from "../../../errors.js";

type ReqBody = { Body: Partial<RuntimeSettings> };
type Response = RuntimeSettings;

const schemaRoute = {
  body: z
    .object({
      enforceAuthForAllRoutes: z.boolean().optional(),
      allowedUnauthenticatedRoutes: z.array(z.string().min(1)).optional(),
      disabledRoutes: z.array(z.string().min(1)).optional(),
      enableStationComments: z.boolean().optional(),
      submissionsEnabled: z.boolean().optional(),
    })
    .strict(),
  response: {
    200: z.object({
      data: z.object({
        enforceAuthForAllRoutes: z.boolean(),
        allowedUnauthenticatedRoutes: z.array(z.string().min(1)),
        disabledRoutes: z.array(z.string().min(1)),
        enableStationComments: z.boolean(),
        submissionsEnabled: z.boolean(),
      }),
    }),
  },
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<Response>>) {
  const patch = req.body;
  if (!patch || typeof patch !== "object") throw new ErrorResponse("BAD_REQUEST");
  const oldSettings = getRuntimeSettings();
  const updated = await updateRuntimeSettings(patch);
  await createAuditLog(
    {
      action: "settings.update",
      table_name: "settings",
      old_values: oldSettings,
      new_values: updated,
    },
    req,
  );
  res.send({ data: updated });
}

const patchSettings: Route<ReqBody, Response> = {
  url: "/settings",
  method: "PATCH",
  schema: schemaRoute,
  config: { permissions: ["update:settings"] },
  handler,
};

export default patchSettings;
