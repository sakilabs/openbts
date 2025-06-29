import debug from "debug";
import Fastify from "fastify";

import { logger } from "./config.js";
import { APIv1Controller } from "./controllers/v1.controller.js";
import { OnRequestHook } from "./hooks/onRequest.hook.js";
import { OnSendHook } from "./hooks/onSend.hook.js";
import { PreHandlerHook } from "./hooks/preHandler.hook.js";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";

import { ValidationError, type ErrorResponse } from "./errors.js";
import type { FastifyZodInstance } from "./interfaces/fastify.interface.js";

export default class App {
	fastify: FastifyZodInstance;
	logger: debug.Debugger;

	constructor() {
		this.logger = logger.extend("app");
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
		this.initHooks();
		this.initMiddlewares();
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
		this.fastify.setErrorHandler((error: ErrorResponse | ValidationError, _, res) => {
			const statusCode = error.statusCode || 500;
			const message = error.message || "An internal server error occurred.";
			const code = error.code || "INTERNAL_SERVER_ERROR";
			const errorResponse: { success: boolean; errors: { code: string; message: string; details?: {}[] }[] } = {
				success: false,
				errors: [
					{
						code,
						message,
					},
				],
			};
			if (error instanceof ValidationError) {
				// @ts-expect-error
				errorResponse.details = (error as ValidationError)?.details || [];
			}

			return res.status(statusCode).send(errorResponse);
		});
	}

	private initMiddlewares(): void {
		this.logger("Registering middlewares");
		this.fastify.register(import("@fastify/cors")).register(import("@fastify/multipart"));
	}

	private initControllers(): void {
		this.logger("Registering controllers");
		this.fastify.register(APIv1Controller, { prefix: "/api/v1" });
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
