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

	public static async initializeTranslations(): Promise<void> {
		await i18n.loadTranslationFiles();
		App.translationsLoaded = true;
	}

	private checkEnvironment(): void {
		const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL", "JWT_REFRESH_SECRET"];
		const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

		if (missingEnvVars.length > 0) {
			throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
		}
	}

	private initHooks(): void {
		this.logger("Registering hooks");
		this.fastify.addHook("onRequest", OnRequestHook);
		this.fastify.addHook("preHandler", PreHandlerHook);
		this.fastify.addHook("onSend", OnSendHook);
	}

	private initMiddlewares(): void {
		this.logger("Registering middlewares");
		this.fastify.register(import("@fastify/cors")).register(import("@fastify/multipart"));
	}

	private initControllers(): void {
		this.logger("Registering controllers");
		this.fastify.register(APIv1Controller);
	}

	public async start(port: number): Promise<void> {
		try {
			await this.fastify.listen({ port, host: "127.0.0.1" });
			this.logger("Server is ready on port %d", port);
		} catch (err) {
			this.logger("Error starting server: %O", err);
			process.exit(1);
		}
	}
}
