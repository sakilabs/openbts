import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { cells } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = {
	message: string;
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!cell) return res.status(404).send({ success: false, message: i18n.t("cell.notFound") });

	await db.delete(cells).where(eq(cells.id, Number(id)));

	return res.send({ success: true, data: { message: i18n.t("cell.deleted") } });
}

const deleteCell: Route<IdParams, ResponseData> = {
	url: "/cells/:id",
	method: "DELETE",
	config: { permissions: ["delete:cells"] },
	handler,
};

export default deleteCell;
