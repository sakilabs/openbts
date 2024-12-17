import { verify } from "argon2";

import { db } from "../../../database/index.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const routeSchema = {
	body: {
		type: "object",
		required: ["username", "password"],
		properties: {
			username: { type: "string" },
			password: { type: "string" },
		},
	},
};

const loginAuth: Route = {
	url: "/login",
	method: "POST",
	schema: routeSchema,
	attachValidation: true,
	handler: async (req: FastifyRequest<{ Body: { username: string; password: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { username, password } = req.body;

		const existingUser = await db.query.users.findFirst({
			where: (fields, { eq }) => eq(fields.username, username),
		});
		if (!existingUser) return res.status(403).send({ success: false, message: "Nieprawidłowa nazwa użytkownika lub hasło" });

		const isPasswordValid = await verify(existingUser.password, password);
		if (!isPasswordValid) return res.status(403).send({ success: false, message: "Nieprawidłowa nazwa użytkownika lub hasło" });
		if (!existingUser.verified)
			return res.status(403).send({ success: false, message: "Twoje konto nie zostało jeszcze aktywowane. Poczekaj na aktywację" });

		const payload = {
			user_id: existingUser.user_id,
			username: existingUser.username,
			display_name: existingUser.display_name,
		};

		return res.send({ success: true, message: "Zalogowano pomyślnie. Przekierowywanie...", token: await res.jwtSign(payload) });
	},
};

export default loginAuth;
