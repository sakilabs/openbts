import { createClient } from "redis";
import { logger } from "../config.js";

const redisLogger = logger.extend("redis");

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
		redisLogger("Redis error: %O", err);
	})
	.on("connect", () => {
		redisLogger("Connected to Redis");
	})
	.on("ready", () => {
		redisLogger("Redis is ready");
	});

export default redis;
