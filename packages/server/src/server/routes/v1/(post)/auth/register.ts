import { hash } from "@node-rs/argon2";
import { eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../../../../database/psql.js";
import { users } from "@openbts/drizzle";
import { i18n } from "../../../../i18n/index.js";
import { redis } from "../../../../database/redis.js";
import { RedisSessionService } from "../../../../services/redis.session.js";
import { JWTService } from "../../../../services/jwt.service.js";

import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "server/interfaces/fastify.interface.js";

interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

interface RegisterResponse {
	sessionId: string;
	tokens: {
		accessToken: string;
		refreshToken: string;
	};
}

const ARGON2_OPTIONS = {
	timeCost: 3,
	memoryCost: 65536,
	parallelism: 4,
	saltLength: 32,
};

export const register: Route = {
	method: "POST",
	url: "/auth/register",
	config: { allowLoggedIn: false },
	handler: async (req: FastifyRequest<{ Body: RegisterBody }>, res: ReplyPayload<JSONBody<RegisterResponse>>) => {
		const { username, email, password } = req.body;

		if (!username || !email || !password) {
			return res.status(400).send({
				success: false,
				error: "Bad Request",
				message: i18n.t("errors.missingFields", req.language),
			});
		}

		const existingUser = await db.query.users.findFirst({
			where: (fields) => or(eq(fields.email, email), eq(fields.username, username)),
		});

		if (existingUser) {
			return res.status(400).send({
				success: false,
				error: "Bad Request",
				message: existingUser.email === email ? i18n.t("errors.emailExists", req.language) : i18n.t("errors.usernameExists", req.language),
			});
		}

		const hashedPassword = await hash(password, ARGON2_OPTIONS);

		const [user] = await db
			.insert(users)
			.values({
				username,
				email,
				password: hashedPassword,
				role: "user",
				created_at: new Date(),
			})
			.returning();

		if (!user) {
			return res.status(500).send({
				success: false,
				error: "Internal Server Error",
				message: i18n.t("errors.internalServerError", req.language),
			});
		}

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

		const response: RegisterResponse = {
			sessionId,
			tokens: {
				accessToken,
				refreshToken,
			},
		};

		return res.status(201).send(response);
	},
};
