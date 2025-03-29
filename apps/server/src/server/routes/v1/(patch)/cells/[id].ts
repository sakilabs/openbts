import { eq } from "drizzle-orm";
import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof cells.$inferInsert };
type ReqParams = { Params: { cell_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof cells.$inferSelect;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { cell_id } = req.params;

	try {
		const cell = await db
			.update(cells)
			.set({
				...req.body,
				last_updated: new Date(),
			})
			.where(eq(cells.id, Number.parseInt(cell_id)))
			.returning();
		if (!cell.length) return res.status(404).send({ success: false, message: "Cell not found" });

		return res.send({ success: true, data: cell[0] });
	} catch (error) {
		return res.status(500).send({ success: false, error: i18n.t("errors.failedToUpdate") });
	}
}

const updateCell: Route<RequestData, ResponseData> = {
	url: "/cells/:cell_id",
	method: "PATCH",
	config: { permissions: ["write:cells"] },
	handler,
};

export default updateCell;
