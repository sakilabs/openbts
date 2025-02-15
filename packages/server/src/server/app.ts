import debug from "debug";
import Fastify from "fastify";

import { logger } from "./config.js";
import { APIv1Controller } from "./controllers/apiController.v1.js";
import { OnRequestHook } from "./hooks/onRequest.hook.js";
import { OnSendHook } from "./hooks/onSend.hook.js";
import { PreHandlerHook } from "./hooks/preHandler.hook.js";
import { i18n } from "./i18n/index.js";

import type { FastifyInstance } from "fastify";

export default class App {
	fastify: FastifyInstance;
	logger: debug.Debugger;
	private static translationsLoaded = false;

	constructor() {
		this.logger = logger.extend("app");
		this.fastify = Fastify({ logger: false, trustProxy: true });

		debug.enable("sakilabs/btsfinder:*");

		if (!App.translationsLoaded) {
			throw new Error("Translations must be initialized before creating App instance");
		}

		this.checkEnvironment();
		this.initHooks();
		this.initMiddlewares();
		this.initControllers();
	}

	private checkEnvironment(): void {
		const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL"];
		const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

		if (missingVars.length > 0) {
			for (const varName of missingVars) {
				this.logger.extend("env")(`\`${varName}\` environment variable is not set.`);
			}
			throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
		}
	}

	public static async initializeTranslations(): Promise<void> {
		if (!App.translationsLoaded) {
			await i18n.loadTranslationFiles();
			App.translationsLoaded = true;
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
