import { i18n } from "../i18n/index.js";

import type { ReplyPayload } from "../interfaces/fastify.interface.js";
import type { JSONBody } from "../interfaces/routes.interface.js";
import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";

export enum ErrorType {
	BAD_REQUEST = "BAD_REQUEST",
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	NOT_FOUND = "NOT_FOUND",
	CONFLICT = "CONFLICT",
	VALIDATION_ERROR = "VALIDATION_ERROR",

	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
	DATABASE_ERROR = "DATABASE_ERROR",
	SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export enum ErrorKey {
	INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
	TOKEN_EXPIRED = "TOKEN_EXPIRED",
	UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
	FORBIDDEN_ACCESS = "FORBIDDEN_ACCESS",

	MISSING_FIELDS = "MISSING_FIELDS",
	INVALID_FORMAT = "INVALID_FORMAT",
	INVALID_VALUE = "INVALID_VALUE",

	RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
	RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",

	DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
	INVALID_REFERENCE = "INVALID_REFERENCE",
	DATABASE_ERROR = "DATABASE_ERROR",

	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
	SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

interface ErrorKeyMapping {
	type: ErrorType;
	status: number;
	translationKey: string;
}

const errorKeyMappings: Record<ErrorKey, ErrorKeyMapping> = {
	[ErrorKey.INVALID_CREDENTIALS]: {
		type: ErrorType.UNAUTHORIZED,
		status: 401,
		translationKey: "errors.invalidCredentials",
	},
	[ErrorKey.TOKEN_EXPIRED]: {
		type: ErrorType.UNAUTHORIZED,
		status: 401,
		translationKey: "errors.tokenExpired",
	},
	[ErrorKey.UNAUTHORIZED_ACCESS]: {
		type: ErrorType.UNAUTHORIZED,
		status: 401,
		translationKey: "errors.unauthorized",
	},
	[ErrorKey.FORBIDDEN_ACCESS]: {
		type: ErrorType.FORBIDDEN,
		status: 403,
		translationKey: "errors.forbidden",
	},

	// Validation errors
	[ErrorKey.MISSING_FIELDS]: {
		type: ErrorType.BAD_REQUEST,
		status: 400,
		translationKey: "errors.missingFields",
	},
	[ErrorKey.INVALID_FORMAT]: {
		type: ErrorType.VALIDATION_ERROR,
		status: 422,
		translationKey: "errors.invalidFormat",
	},
	[ErrorKey.INVALID_VALUE]: {
		type: ErrorType.VALIDATION_ERROR,
		status: 422,
		translationKey: "errors.invalidValue",
	},

	[ErrorKey.RESOURCE_NOT_FOUND]: {
		type: ErrorType.NOT_FOUND,
		status: 404,
		translationKey: "errors.resourceNotFound",
	},
	[ErrorKey.RESOURCE_ALREADY_EXISTS]: {
		type: ErrorType.CONFLICT,
		status: 409,
		translationKey: "errors.resourceAlreadyExists",
	},

	[ErrorKey.DUPLICATE_ENTRY]: {
		type: ErrorType.CONFLICT,
		status: 409,
		translationKey: "errors.duplicateEntry",
	},
	[ErrorKey.INVALID_REFERENCE]: {
		type: ErrorType.BAD_REQUEST,
		status: 400,
		translationKey: "errors.invalidReference",
	},
	[ErrorKey.DATABASE_ERROR]: {
		type: ErrorType.DATABASE_ERROR,
		status: 500,
		translationKey: "errors.databaseError",
	},

	// Server errors
	[ErrorKey.INTERNAL_SERVER_ERROR]: {
		type: ErrorType.INTERNAL_SERVER_ERROR,
		status: 500,
		translationKey: "errors.internalServerError",
	},
	[ErrorKey.SERVICE_UNAVAILABLE]: {
		type: ErrorType.SERVICE_UNAVAILABLE,
		status: 503,
		translationKey: "errors.serviceUnavailable",
	},
};

const errorStatusCodes: Record<ErrorType, number> = {
	[ErrorType.BAD_REQUEST]: 400,
	[ErrorType.UNAUTHORIZED]: 401,
	[ErrorType.FORBIDDEN]: 403,
	[ErrorType.NOT_FOUND]: 404,
	[ErrorType.CONFLICT]: 409,
	[ErrorType.VALIDATION_ERROR]: 422,
	[ErrorType.INTERNAL_SERVER_ERROR]: 500,
	[ErrorType.DATABASE_ERROR]: 500,
	[ErrorType.SERVICE_UNAVAILABLE]: 503,
};

export interface AppError {
	type: ErrorType;
	message: string;
	details?: unknown;
	_errorKey?: ErrorKey;
}

export interface FieldErrorDetails {
	field: string;
	message: string;
	[key: string]: unknown;
}

export interface ErrorResponse {
	status: number;
	type: string;
	detail?: string;
	instance?: string;
	errors?: Record<string, string>[];
	timestamp?: string;
	traceId?: string;
}

/**
 * Creates an application error object using a predefined error key
 * The translation will be handled automatically by the global error handler
 * @param errorKey Predefined error key
 * @param [details] Additional error details
 * @returns AppError object
 */
export function err(errorKey: ErrorKey, details?: unknown): AppError {
	const mapping = errorKeyMappings[errorKey];
	return {
		type: mapping.type,
		message: mapping.translationKey,
		details,
		_errorKey: errorKey,
	};
}

/**
 * Type guard for AppError
 */
function isAppError(error: unknown): error is AppError {
	return (
		typeof error === "object" &&
		error !== null &&
		"type" in error &&
		"message" in error &&
		typeof (error as AppError).type === "string" &&
		typeof (error as AppError).message === "string"
	);
}

/**
 * Type guard for key-based AppError
 */
function isKeyBasedError(error: AppError): error is AppError & { _errorKey: ErrorKey } {
	return "_errorKey" in error && typeof (error as AppError & { _errorKey: ErrorKey })._errorKey === "string";
}

/**
 * Type guard for field error details
 */
function isFieldErrorDetails(details: unknown): details is FieldErrorDetails {
	return (
		typeof details === "object" &&
		details !== null &&
		"field" in details &&
		"message" in details &&
		typeof (details as FieldErrorDetails).field === "string" &&
		typeof (details as FieldErrorDetails).message === "string"
	);
}

/**
 * Type guard for database errors
 */
function isDatabaseError(error: Error): boolean {
	// Check for common database error patterns
	return (
		error.message.includes("database") ||
		error.message.includes("sql") ||
		error.message.includes("query") ||
		error.message.includes("constraint") ||
		error.message.includes("duplicate") ||
		error.message.includes("foreign key") ||
		error.message.toLowerCase().includes("postgres")
	);
}

/**
 * Handles errors in routes and sends appropriate response
 * @param res Fastify reply object
 * @param error Error object (AppError, Error, or unknown)
 * @param [language] Language for i18n
 * @param requestId Optional request ID for tracing
 */
export function handleError<T = unknown>(
	res: ReplyPayload<JSONBody<T>>,
	error: AppError | Error | unknown,
	language?: string,
	requestId?: string,
): void {
	// Handle AppError
	if (isAppError(error)) {
		const statusCode = errorStatusCodes[error.type];
		let errorMessage = error.message;

		if (isKeyBasedError(error) && language) {
			errorMessage = i18n.t(error.message, language);
		} else if (error.message.startsWith("errors.") && language) {
			errorMessage = i18n.t(error.message, language);
		}

		const response: ErrorResponse = {
			status: statusCode,
			type: error.type,
			detail: errorMessage,
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		if (error.details) {
			if (isFieldErrorDetails(error.details)) {
				response.errors = [
					{
						[String(error.details.field)]: String(error.details.message),
					},
				];
			} else {
				response.errors = [{ detail: String(error.details) }];
			}
		}

		res.status(statusCode).send(response);
		return;
	}

	if (error instanceof Error) {
		if (isDatabaseError(error)) {
			handleDatabaseError(res, error, language, requestId);
			return;
		}

		const response: ErrorResponse = {
			status: 500,
			type: ErrorType.INTERNAL_SERVER_ERROR,
			detail: language ? i18n.t("errors.internalServerError", language) : "Internal server error",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		res.status(500).send(response);
		return;
	}

	const response: ErrorResponse = {
		status: 500,
		type: ErrorType.INTERNAL_SERVER_ERROR,
		detail: language ? i18n.t("errors.internalServerError", language) : "Internal server error",
		timestamp: new Date().toISOString(),
	};

	if (requestId) {
		response.traceId = requestId;
	}

	res.status(500).send(response);
}

/**
 * Handle database-specific errors
 */
function handleDatabaseError<T = unknown>(res: ReplyPayload<JSONBody<T>>, error: Error, language?: string, requestId?: string): void {
	// Extract error code and details if available
	const errorMessage = error.message.toLowerCase();
	let response: ErrorResponse;

	if (errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
		response = {
			status: 409,
			type: ErrorType.CONFLICT,
			detail: language ? i18n.t("errors.duplicateEntry", language) : "Duplicate entry",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		res.status(409).send(response);
		return;
	}

	if (errorMessage.includes("foreign key")) {
		response = {
			status: 400,
			type: ErrorType.BAD_REQUEST,
			detail: language ? i18n.t("errors.invalidReference", language) : "Invalid reference",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		res.status(400).send(response);
		return;
	}

	if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
		response = {
			status: 404,
			type: ErrorType.NOT_FOUND,
			detail: language ? i18n.t("errors.resourceNotFound", language) : "Resource not found",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		res.status(404).send(response);
		return;
	}

	response = {
		status: 500,
		type: ErrorType.DATABASE_ERROR,
		detail: language ? i18n.t("errors.databaseError", language) : "Database error",
		timestamp: new Date().toISOString(),
	};

	if (requestId) {
		response.traceId = requestId;
	}

	res.status(500).send(response);
}

/**
 * Helper function to handle async route handlers with automatic error handling
 * @param handler Async route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T, U>(handler: (req: T, res: ReplyPayload<JSONBody<U>>) => Promise<void>) {
	return async (req: T, res: ReplyPayload<JSONBody<U>>) => {
		try {
			await handler(req, res);
		} catch (error) {
			// Get language from request if available
			const language = (req as { language?: string })?.language;
			// Get request ID if available
			const requestId = (req as { id?: string })?.id;
			handleError(res, error, language, requestId);
		}
	};
}

/**
 * Registers global error handling hooks with Fastify
 * @param fastify Fastify instance
 */
export function registerErrorHandlers(fastify: FastifyInstance): void {
	// Register onError hook to handle all errors
	fastify.setErrorHandler((error: Error | AppError | unknown, request: FastifyRequest, reply: FastifyReply) => {
		const language = request?.language;
		const requestId = request?.id;

		// Handle AppError
		if (isAppError(error)) {
			const statusCode = errorStatusCodes[error.type];
			let errorMessage = error.message;

			// Check if this is a key-based error and translate if needed
			if (isKeyBasedError(error) && language) {
				errorMessage = i18n.t(error.message, language);
			} else if (error.message.startsWith("errors.") && language) {
				// If the message looks like a translation key, try to translate it
				errorMessage = i18n.t(error.message, language);
			}

			const response: ErrorResponse = {
				status: statusCode,
				type: error.type,
				detail: errorMessage,
				timestamp: new Date().toISOString(),
			};

			if (requestId) {
				response.traceId = requestId;
			}

			if (error.details) {
				if (isFieldErrorDetails(error.details)) {
					response.errors = [
						{
							[String(error.details.field)]: String(error.details.message),
						},
					];
				} else {
					response.errors = [{ detail: String(error.details) }];
				}
			}

			return reply.status(statusCode).send(response);
		}

		// Handle standard Error
		if (error instanceof Error) {
			// Check for specific database errors
			if (isDatabaseError(error)) {
				return handleDatabaseErrorGlobal(error, reply, language, requestId);
			}

			// Generic error handling
			const response: ErrorResponse = {
				status: 500,
				type: ErrorType.INTERNAL_SERVER_ERROR,
				detail: language ? i18n.t("errors.internalServerError", language) : "Internal server error",
				timestamp: new Date().toISOString(),
			};

			if (requestId) {
				response.traceId = requestId;
			}

			return reply.status(500).send(response);
		}

		// Handle unknown errors
		const response: ErrorResponse = {
			status: 500,
			type: ErrorType.INTERNAL_SERVER_ERROR,
			detail: language ? i18n.t("errors.internalServerError", language) : "Internal server error",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		return reply.status(500).send(response);
	});
}

/**
 * Handle database-specific errors for global error handler
 */
function handleDatabaseErrorGlobal(error: Error, reply: FastifyReply, language?: string, requestId?: string): FastifyReply {
	// Extract error code and details if available
	const errorMessage = error.message.toLowerCase();
	let response: ErrorResponse;

	// Handle specific database errors
	if (errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
		response = {
			status: 409,
			type: ErrorType.CONFLICT,
			detail: language ? i18n.t("errors.duplicateEntry", language) : "Duplicate entry",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		return reply.status(409).send(response);
	}

	if (errorMessage.includes("foreign key")) {
		response = {
			status: 400,
			type: ErrorType.BAD_REQUEST,
			detail: language ? i18n.t("errors.invalidReference", language) : "Invalid reference",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		return reply.status(400).send(response);
	}

	if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
		response = {
			status: 404,
			type: ErrorType.NOT_FOUND,
			detail: language ? i18n.t("errors.resourceNotFound", language) : "Resource not found",
			timestamp: new Date().toISOString(),
		};

		if (requestId) {
			response.traceId = requestId;
		}

		return reply.status(404).send(response);
	}

	// Generic database error
	response = {
		status: 500,
		type: ErrorType.DATABASE_ERROR,
		detail: language ? i18n.t("errors.databaseError", language) : "Database error",
		timestamp: new Date().toISOString(),
	};

	if (requestId) {
		response.traceId = requestId;
	}

	return reply.status(500).send(response);
}
