import { verify } from "@node-rs/argon2";
import { eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../../../../database/index.js";
import { users } from "@openbts/drizzle";
import { i18n } from "../../../../i18n/index.js";
import { redis } from "../../../../database/redis.js";
import { RedisSessionService } from "../../../../services/redis.session.js";
import { JWTService } from "../../../../services/jwt.service.js";

import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "server/interfaces/fastify.interface.js";

interface LoginBody {
	login: string;
	password: string;
}

export const login: Route = {
	method: "POST",
	url: "/auth/login",
	config: { allowLoggedIn: false },
	handler: async (
		req: FastifyRequest<{ Body: LoginBody }>,
		res: ReplyPayload<JSONBody<{ sessionId: string; tokens: { accessToken: string; refreshToken: string } }>>,
	) => {
		const { login, password } = req.body;

		if (!login || !password) {
			return res.status(400).send({
				success: false,
				error: "Bad Request",
				message: i18n.t("errors.missingFields", req.language),
			});
		}

		const user = await db.query.users.findFirst({
			where: (fields) => or(eq(fields.email, login), eq(fields.username, login)),
		});

		if (!user) {
			return res.status(401).send({
				success: false,
				error: "Unauthorized",
				message: i18n.t("errors.invalidCredentials", req.language),
			});
		}

		const isValid = await verify(user.password, password);
		if (!isValid) {
			return res.status(401).send({
				success: false,
				error: "Unauthorized",
				message: i18n.t("errors.invalidCredentials", req.language),
			});
		}

		await db.update(users).set({ last_login: new Date() }).where(eq(users.id, user.id));

		const jwtService = JWTService.getInstance();
		const accessToken = await jwtService.signAccessToken({
			type: "user",
			jti: randomUUID(),
			sub: user.id.toString(),
		});

		const refreshToken = await jwtService.signRefreshToken({
			type: "refresh",
			jti: randomUUID(),
			sub: user.id.toString(),
		});

		const sessionService = new RedisSessionService(redis);
		const sessionId = await sessionService.createSession(user.id, accessToken, refreshToken);

		return res.send({
			success: true,
			data: {
				sessionId,
				tokens: {
					accessToken,
					refreshToken,
				},
			},
		});
	},
};
