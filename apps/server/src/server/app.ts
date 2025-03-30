import debug from "debug";
import Fastify from "fastify";

import { logger } from "./config.js";
import { APIv1Controller } from "./controllers/apiController.v1.js";
import { OnRequestHook } from "./hooks/onRequest.hook.js";
import { OnSendHook } from "./hooks/onSend.hook.js";
import { PreHandlerHook } from "./hooks/preHandler.hook.js";
import { i18n } from "./i18n/index.js";
//import { registerErrorHandlers } from "./utils/errorHelper.js";

import type { FastifyInstance } from "fastify";

export default class App {
	fastify: FastifyInstance;
	logger: debug.Debugger;
	private static translationsLoaded = false;

	constructor() {
		this.logger = logger.extend("app");
		this.fastify = Fastify({ logger: false, trustProxy: true });

		debug.enable("sakilabs/openbts:*");

		if (!App.translationsLoaded) throw new Error("Translations must be initialized before creating App instance");

		this.checkEnvironment();
		this.initHooks();
		this.initMiddlewares();
		//this.initErrorHandlers();
		this.initControllers();
	}

	private checkEnvironment(): void {
		const requiredEnvVars = ["DATABASE_URL"];
		const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

		if (missingEnvVars.length > 0) throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
	}

	private initHooks(): void {
		this.logger("Registering hooks");

		const requestStartTime = Symbol("requestStartTime");
		this.fastify.decorateRequest(requestStartTime, 0);
		this.fastify.addHook("onRequest", OnRequestHook);
		this.fastify.addHook("preHandler", PreHandlerHook);
		this.fastify.addHook("onSend", OnSendHook);
	}

	private initMiddlewares(): void {
		this.logger("Registering middlewares");
		this.fastify.register(import("@fastify/cors")).register(import("@fastify/multipart"));
	}

	// private initErrorHandlers(): void {
	// 	this.logger("Registering global error handlers");
	// 	registerErrorHandlers(this.fastify);
	// }

	private initControllers(): void {
		this.logger("Registering controllers");
		this.fastify.register(APIv1Controller, { prefix: "/api/v1" });
	}

	public static async initializeTranslations(): Promise<void> {
		await i18n.loadTranslationFiles();
		App.translationsLoaded = true;
	}

	public async listen(port: number): Promise<void> {
		try {
			await this.fastify.listen({ port, host: "127.0.0.1" });
			this.logger("Server is ready on port %d", port);
		} catch (err) {
			this.logger("Error starting server: %O", err);
			process.exit(1);
		}
	}
}
