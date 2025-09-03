import { createClient } from "redis";
import { dlogger } from "../config.js";
import { logger } from "../utils/logger.js";

const redisLogger = dlogger.extend("redis");

export const redis = createClient({
	url: process.env.REDIS_URL || "redis://localhost:6379",
	socket: {
		reconnectStrategy: (retries: number) => {
			const delay = Math.min(retries * 1000, 2000);
			redisLogger("Retrying Redis connection in %d ms", delay);
			return delay;
		},
		connectTimeout: 1000,
	},
})
	.on("error", (err: Error) => {
		logger.error("Redis error: %O", err);
		redisLogger("Redis error: %O", err);
	})
	.on("connect", () => {
		redisLogger("Connected to Redis");
	})
	.on("ready", () => {
		redisLogger("Redis is ready");
	});

redis
	.connect()
	.then(() => {
		redisLogger("Connected to Redis");
	})
	.catch((err) => {
		logger.error("Redis connection error: %O", err);
	});

export default redis;
