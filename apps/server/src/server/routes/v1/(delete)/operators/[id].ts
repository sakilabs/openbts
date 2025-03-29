import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { operators } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = {
	message: string;
};

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						message: { type: "string" },
					},
				},
			},
		},
		404: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
		500: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!operator) return res.status(404).send({ success: false, message: i18n.t("operator.notFound") });

	try {
		await db.delete(operators).where(eq(operators.id, Number(id)));
	} catch (error) {
		return res.status(500).send({ success: false, error: i18n.t("errors.failedToDelete", req.language) });
	}

	return res.send({ success: true, data: { message: i18n.t("operator.deleted") } });
}

const deleteOperator: Route<IdParams, ResponseData> = {
	url: "/operators/:id",
	method: "DELETE",
	config: { permissions: ["delete:operators"] },
	schema: schemaRoute,
	handler,
};

export default deleteOperator;
