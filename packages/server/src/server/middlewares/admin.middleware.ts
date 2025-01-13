import { i18n } from "../i18n/index.js";
import { allowed_users } from "../config.js";
import { db } from "../database/index.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function AdminMiddleware(req: FastifyRequest, res: FastifyReply) {
	const { user_id } = req.user as { user_id: number };
	const user = await db.query.users.findFirst({
		where: (fields, { eq }) => eq(fields.id, user_id),
	});
	if (!user || !allowed_users.includes(user.id))
		return res.status(403).send({ success: false, message: i18n.t("errors.unauthorized", req.language) });
}
