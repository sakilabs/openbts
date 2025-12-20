import { z } from "zod/v4";

import { importStations } from "@openbts/uke-importer/stations";
import { importRadiolines } from "@openbts/uke-importer/radiolines";
import { cleanupDownloads } from "@openbts/uke-importer/utils";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	body: z.object({
		importStations: z.boolean().optional().default(true),
		importRadiolines: z.boolean().optional().default(true),
	}),
	response: {
		200: z.object({
			stationsImported: z.boolean(),
			radiolinesImported: z.boolean(),
		}),
	},
};

type ReqBody = {
	Body: z.infer<typeof schemaRoute.body>;
};

type ResponseData = {
	stationsImported: boolean;
	radiolinesImported: boolean;
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { importStations: shouldImportStations, importRadiolines: shouldImportRadiolines } = req.body;

	try {
		const stationsImported = shouldImportStations ? await importStations() : false;
		const radiolinesImported = shouldImportRadiolines ? await importRadiolines() : false;

		res.send({
			data: {
				stationsImported,
				radiolinesImported,
			},
		});
	} catch (error) {
		req.log.error(error);
		throw error;
	} finally {
		await cleanupDownloads();
	}
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
