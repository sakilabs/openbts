import { Redis } from "ioredis";
import { logger } from "../config.js";

const redisLogger = logger.extend("redis");

export const redis = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASSWORD,
	retryStrategy: (times) => {
		const delay = Math.min(times * 10000, 2000);
		redisLogger("Retrying Redis connection in %d ms", delay);
		return delay;
	},
});

redis.on("error", (err) => {
	redisLogger("Redis error: %O", err);
});

redis.on("connect", () => {
	redisLogger("Connected to Redis");
});

export default redis;
