import { z } from "zod/v4";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";
import { getRuntimeSettings, type RuntimeSettings } from "../../../services/settings.service.js";

type Response = RuntimeSettings;

export const settingsDataSchema = z.object({
  enforceAuthForAllRoutes: z.boolean(),
  allowedUnauthenticatedRoutes: z.array(z.string().min(1)),
  disabledRoutes: z.array(z.string().min(1)),
  enableStationComments: z.boolean(),
  submissionsEnabled: z.boolean(),
  announcement: z.object({
    message: z.string(),
    enabled: z.boolean(),
    type: z.enum(["info", "warning", "error"]),
  }),
});

const schemaRoute = {
  response: {
    200: z.object({ data: settingsDataSchema }),
  },
};

async function handler(_: FastifyRequest, res: ReplyPayload<JSONBody<Response>>) {
  const settings = getRuntimeSettings();
  res.send({ data: settings });
}

const getSettings: Route<never, Response> = {
  url: "/settings",
  method: "GET",
  schema: schemaRoute,
  config: { permissions: ["read:settings"], allowGuestAccess: true },
  handler,
};

export default getSettings;
