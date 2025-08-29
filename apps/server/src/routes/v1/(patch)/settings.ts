import { z } from "zod/v4";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";
import { updateRuntimeSettings, type RuntimeSettings } from "../../../services/settings.service.js";
import { ErrorResponse } from "../../../errors.js";

type ReqBody = { Body: Partial<RuntimeSettings> };
type Response = RuntimeSettings;

const schemaRoute = {
	body: z
		.object({
			enforceAuthForAllRoutes: z.boolean().optional(),
			allowedUnauthenticatedRoutes: z.array(z.string().min(1)).optional(),
			disabledRoutes: z.array(z.string().min(1)).optional(),
		})
		.strict(),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.object({
				enforceAuthForAllRoutes: z.boolean(),
				allowedUnauthenticatedRoutes: z.array(z.string().min(1)),
				disabledRoutes: z.array(z.string().min(1)),
			}),
		}),
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<Response>>) {
	const patch = req.body;
	if (!patch || typeof patch !== "object") throw new ErrorResponse("BAD_REQUEST");
	const updated = await updateRuntimeSettings(patch);
	res.send({ success: true, data: updated });
}

const patchSettings: Route<ReqBody, Response> = {
	url: "/settings",
	method: "PATCH",
	schema: schemaRoute,
	config: { permissions: ["update:settings"] },
	handler,
};

export default patchSettings;
