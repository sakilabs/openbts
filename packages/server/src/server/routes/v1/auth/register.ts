import { hash } from "argon2";

import { db } from "../../../database/index.js";
import { users } from "../../../database/schemas/users.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const registerAuth: Route = {
	url: "/register",
	method: "POST",
	schema: {
		body: {
			type: "object",
			required: ["username", "displayName", "password"],
			properties: {
				username: { type: "string" },
				displayName: { type: "string" },
				password: { type: "string" },
			},
		},
	},
	attachValidation: true,
	handler: async (
		req: FastifyRequest<{ Body: { username: string; displayName: string; password: string } }>,
		res: ReplyPayload<BasicResponse<unknown>>,
	) => {
		const { username, displayName, password } = req.body;

		const existingUser = await db.query.users.findMany({
			where: (fields, { eq }) => eq(fields.username, username),
		});
		if (existingUser.length > 0) return res.status(400).send({ success: false, message: "Taka nazwa użytkownika już istnieje" });

		const hashedPassword = await hash(password);
		await db.insert(users).values({
			display_name: displayName,
			username,
			password: hashedPassword,
			verified: false,
		});

		return res.status(201).send({ success: true, message: "Użytkownik zarejestrowany. Poczekaj na aktywację konta przez administratora" });
	},
};

export default registerAuth;
