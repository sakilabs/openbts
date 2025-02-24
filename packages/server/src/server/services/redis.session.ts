import type { ChainableCommander, Redis } from "ioredis";

import { REDIS_REVOKED_TOKEN_PREFIX, REDIS_REVOKED_TOKEN_TTL, REDIS_SESSION_PREFIX, REDIS_USER_SESSIONS_PREFIX } from "../constants.js";

export class RedisSessionService {
	private redis: Redis;

	constructor(redisClient: Redis) {
		this.redis = redisClient;
	}

	/**
	 * Create a new session for a user
	 * @param userId User ID
	 * @param accessToken Access token
	 * @param refreshToken Refresh token
	 * @param ttl Time to live in seconds
	 */
	async createSession(userId: number, accessToken: string, refreshToken: string, ttl: number = 7 * 24 * 60 * 60): Promise<string> {
		const sessionId = `${userId}:${Date.now()}`;
		const fullSessionKey = `${REDIS_SESSION_PREFIX}${sessionId}`;
		const userSessionsKey = `${REDIS_USER_SESSIONS_PREFIX}${userId}`;

		await this.redis.hmset(fullSessionKey, {
			userId: userId.toString(),
			accessToken,
			refreshToken,
			createdAt: Date.now().toString(),
		});

		await this.redis.expire(fullSessionKey, ttl);
		await this.redis.sadd(userSessionsKey, sessionId);

		return sessionId;
	}

	/**
	 * Get session details
	 * @param sessionId Session ID
	 */
	async getSession(sessionId: string): Promise<Record<string, string> | null> {
		const fullSessionKey = `${REDIS_SESSION_PREFIX}${sessionId}`;
		return (await this.redis.hgetall(fullSessionKey)) || null;
	}

	/**
	 * Update the access token for a specific session identified by refresh token
	 * @param userId User ID
	 * @param refreshToken Refresh token to identify the session
	 * @param accessToken New access token
	 */
	async updateSessionAccessToken(userId: number, refreshToken: string, accessToken: string): Promise<void> {
		const userSessionsKey = `${REDIS_USER_SESSIONS_PREFIX}${userId}`;
		const sessions = await this.redis.smembers(userSessionsKey);

		if (sessions.length === 0) return;

		for (const sessionId of sessions) {
			const fullSessionKey = `${REDIS_SESSION_PREFIX}${sessionId}`;
			const session = await this.redis.hgetall(fullSessionKey);

			if (session && session.refreshToken === refreshToken) {
				await this.redis.hset(fullSessionKey, "accessToken", accessToken);
				break;
			}
		}
	}

	/**
	 * Mark a token as revoked in Redis
	 * @param jti The token's JTI (JWT ID)
	 */
	private async revokeTokenById(pipeline: ChainableCommander, jti: string): Promise<void> {
		const key = `${REDIS_REVOKED_TOKEN_PREFIX}${jti}`;
		pipeline.setex(key, REDIS_REVOKED_TOKEN_TTL, "1");
	}

	/**
	 * Revoke a specific session and its tokens
	 * @param accessToken Access token to find and revoke the session
	 * @param accessJti The access token's JTI
	 * @param refreshJti The refresh token's JTI
	 */
	async revokeSession(accessToken: string, accessJti?: string, refreshJti?: string): Promise<void> {
		const pipeline = this.redis.pipeline();

		if (accessJti) this.revokeTokenById(pipeline, accessJti);
		if (refreshJti) this.revokeTokenById(pipeline, refreshJti);
		await pipeline.exec();

		const sessionKeys = await this.redis.keys(`${REDIS_SESSION_PREFIX}*`);

		for (const fullSessionKey of sessionKeys) {
			const session = await this.redis.hgetall(fullSessionKey);

			if (session && session.accessToken === accessToken) {
				const userId = Number.parseInt(session.userId as string);
				const sessionId = fullSessionKey.replace(REDIS_SESSION_PREFIX, "");
				const userSessionsKey = `${REDIS_USER_SESSIONS_PREFIX}${userId}`;

				await this.redis.srem(userSessionsKey, sessionId);
				await this.redis.del(fullSessionKey);
				break;
			}
		}
	}

	/**
	 * Revoke a specific session by session ID and user ID
	 * @param userId User ID
	 * @param sessionId Session ID
	 */
	async revokeSessionById(userId: number, sessionId: string): Promise<void> {
		const fullSessionKey = `${REDIS_SESSION_PREFIX}${sessionId}`;
		const userSessionsKey = `${REDIS_USER_SESSIONS_PREFIX}${userId}`;

		await this.redis.srem(userSessionsKey, sessionId);
		await this.redis.del(fullSessionKey);
	}

	/**
	 * Revoke all sessions for a user
	 * @param userId User ID
	 */
	async revokeAllUserSessions(userId: number): Promise<void> {
		const userSessionsKey = `${REDIS_USER_SESSIONS_PREFIX}${userId}`;

		const sessions = await this.redis.smembers(userSessionsKey);
		const pipeline = this.redis.pipeline();
		for (const sessionId of sessions) {
			const fullSessionKey = `${REDIS_SESSION_PREFIX}${sessionId}`;
			pipeline.del(fullSessionKey);
		}

		pipeline.del(userSessionsKey);
		await pipeline.exec();
	}

	/**
	 * Get all active sessions for a user
	 * @param userId User ID
	 */
	async getUserSessions(userId: number): Promise<string[]> {
		const userSessionsKey = `${REDIS_USER_SESSIONS_PREFIX}${userId}`;
		return await this.redis.smembers(userSessionsKey);
	}
}
