import debug from "debug";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";

import { dlogger } from "./config.js";
import { APIv1Controller } from "./controllers/v1.controller.js";
import { OnRequestHook } from "./hooks/onRequest.hook.js";
import { OnSendHook } from "./hooks/onSend.hook.js";
import { PreHandlerHook } from "./hooks/preHandler.hook.js";
import { initRuntimeSettings } from "./services/settings.service.js";
import { ValidationError, type ErrorResponse } from "./errors.js";
import { registerRateLimit } from "./plugins/ratelimit.plugin.js";
import { logger, serializeError } from "./utils/logger.js";

import type { FastifyZodInstance } from "./interfaces/fastify.interface.js";

export default class App {
	fastify: FastifyZodInstance;
	dlogger: debug.Debugger;

	constructor() {
		this.dlogger = dlogger.extend("app");
		this.fastify = Fastify({
			logger: false,
			trustProxy: true,
			// ajv: {
			// 	customOptions: {
			// 		allErrors: true,
			// 	},
			// },
			// schemaErrorFormatter: (errors, _) => {
			// 	const formattedErrors = errors.map((err) => ({
			// 		field: String(err.instancePath?.slice(1) || err.params?.missingProperty || "unknown"),
			// 		validationMessage: err.message,
			// 	}));

			// 	return new ValidationError(formattedErrors);
			// },
		}).withTypeProvider<ZodTypeProvider>();
		this.fastify.setValidatorCompiler(validatorCompiler);
		this.fastify.setSerializerCompiler(serializerCompiler);

		debug.enable("sakilabs/openbts:*");

		this.checkEnvironment();
		this.initServices();
		this.initHooks();
		this.initMiddlewares();
		this.initControllers();
	}

	private checkEnvironment(): void {
		const requiredEnvVars = ["DATABASE_URL"];
		const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

		if (missingEnvVars.length > 0) throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
	}

	private async initServices(): Promise<void> {
		await initRuntimeSettings();
	}

	private initHooks(): void {
		this.dlogger("Registering hooks");

		const requestStartTime = Symbol("requestStartTime");
		this.fastify.decorateRequest(requestStartTime, 0);
		this.fastify.addHook("onRequest", OnRequestHook);
		this.fastify.addHook("preHandler", PreHandlerHook);
		this.fastify.addHook("onSend", OnSendHook);
		registerRateLimit(this.fastify);
		this.fastify.setErrorHandler((error: ErrorResponse | ValidationError, req, res) => {
			const statusCode = error.statusCode || 500;
			const message = error.message || "An internal server error occurred.";
			const code = error.code || "INTERNAL_SERVER_ERROR";
			if (error.statusCode !== 401) {
				logger.error("INTERNAL_SERVER_ERROR", {
					...serializeError(error),
					statusCode,
					code,
					method: req?.method,
					url: req?.url,
					ip: req?.ip,
					host: req?.hostname,
					reqId: req?.id,
					userId: req?.userSession?.user?.id ?? undefined,
				});
			}

			const errorResponse: {
				success: boolean;
				errors: {
					code: string;
					message: string;
					details?: {
						field: string;
						validationMessage: string | undefined;
					}[];
				}[];
			} = {
				success: false,
				errors: [
					{
						code,
						message,
					},
				],
			};
			if (error instanceof ValidationError && errorResponse.errors[0]) {
				errorResponse.errors[0].details = (error as ValidationError)?.details || [];
			}

			return res.status(statusCode).send(errorResponse);
		});
	}

	private initMiddlewares(): void {
		this.dlogger("Registering middlewares");
		this.fastify.register(import("@fastify/cors")).register(import("@fastify/multipart"));
	}

	private initControllers(): void {
		this.dlogger("Registering controllers");
		this.fastify.register(APIv1Controller, { prefix: "/api/v1" });
	}

	public async listen(port: number): Promise<void> {
		try {
			await this.fastify.listen({ port, host: "127.0.0.1" });
			this.dlogger("Server is ready on port %d", port);
		} catch (err) {
			this.dlogger("Error starting server: %O", err);
			process.exit(1);
		}
	}
}
