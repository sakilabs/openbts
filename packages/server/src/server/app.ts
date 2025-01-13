import debug from "debug";
import Fastify from "fastify";

import { logger } from "./config.js";
import { APIv1Controller } from "./controllers/apiController.v1.js";
import { OnRequestHook } from "./hooks/onRequest.hook.js";
import { OnSendHook } from "./hooks/onSend.hook.js";
import { PreHandlerHook } from "./hooks/preHandler.hook.js";

import type { FastifyInstance } from "fastify";

export default class App {
	fastify: FastifyInstance;
	logger: debug.Debugger;

	constructor() {
		this.logger = logger.extend("app");
		this.fastify = Fastify({ logger: false, trustProxy: true });

		debug.enable("sakilabs/btsfinder:*");

		this.checkEnvironment();
		this.initHooks();
		this.initMiddlewares();
		this.initControllers();
	}

	private checkEnvironment(): void {
		if (!process.env.JWT_SECRET) {
			this.logger.extend("env")("`JWT_SECRET` environment variable is not set. Exiting...");
			throw new Error("JWT_SECRET environment variable is not set");
		}

		if (!process.env.DATABASE_URL) {
			this.logger.extend("env")("`DATABASE_URL` environment variable is not set. Exiting...");
			throw new Error("DATABASE_URL environment variable is not set");
		}

		if (!process.env.PUBLIC_ACCESS || !["true", "false"].includes(process.env.PUBLIC_ACCESS)) {
			this.logger.extend("env")("`PUBLIC_ACCESS` environment variable is not set, defaulting to `true`");
			process.env.PUBLIC_ACCESS = "true";
		}

		if (!process.env.ENABLE_COMMENTS || !["true", "false"].includes(process.env.ENABLE_COMMENTS)) {
			this.logger.extend("env")("`ENABLE_COMMENTS` environment variable is not set, defaulting to `true`");
			process.env.ENABLE_COMMENTS = "true";
		}
	}

	private initMiddlewares(): void {
		this.logger("Registering middlewares");
		this.fastify.register(import("@fastify/cors")).register(import("@fastify/multipart"));
		this.fastify.register(import("@fastify/jwt"), {
			secret: process.env.JWT_SECRET,
		});
	}

	private initControllers(): void {
		this.logger("Registering controllers");
		this.fastify.register(APIv1Controller, { prefix: "/api/v1" });
	}

	private initHooks(): void {
		this.logger("Registering hooks");
		const requestStartTime = Symbol("requestStartTime");
		this.fastify.decorateRequest(requestStartTime, 0);

		this.fastify.addHook("preHandler", PreHandlerHook);
		this.fastify.addHook("onRequest", OnRequestHook);
		this.fastify.addHook("onSend", OnSendHook);
	}

	listen(port: number): void {
		this.fastify.listen({ port, host: "127.0.0.1" }, () => {
			this.logger(`Server is ready on port ${port}`);
		});
	}
}
