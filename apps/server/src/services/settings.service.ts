import { redis } from "../database/redis.js";

type NonEmptyString = string & { __brand: "NonEmptyString" };

export interface RuntimeSettings {
	enforceAuthForAllRoutes: boolean;
	allowedUnauthenticatedRoutes: NonEmptyString[];
	disabledRoutes: NonEmptyString[];
	enableStationComments: boolean;
	submissionsEnabled: boolean;
}

const SETTINGS_KEY = "runtime:settings";
const CHANNEL = "runtime:settings:updates";

const defaultSettings: RuntimeSettings = {
	enforceAuthForAllRoutes: false,
	allowedUnauthenticatedRoutes: ["/api/v1/auth"] as NonEmptyString[],
	disabledRoutes: [],
	enableStationComments: false,
	submissionsEnabled: true,
};

let inMemorySettings: RuntimeSettings = { ...defaultSettings };
let initialized = false;

function isNonEmptyString(value: unknown): value is NonEmptyString {
	return typeof value === "string" && value.length > 0;
}

function isSettings(obj: unknown): obj is RuntimeSettings {
	if (!obj || typeof obj !== "object") return false;
	const candidate = obj as RuntimeSettings;
	return (
		typeof candidate.enforceAuthForAllRoutes === "boolean" &&
		Array.isArray(candidate.allowedUnauthenticatedRoutes) &&
		candidate.allowedUnauthenticatedRoutes.every(isNonEmptyString) &&
		Array.isArray(candidate.disabledRoutes) &&
		candidate.disabledRoutes.every(isNonEmptyString) &&
		typeof candidate.enableStationComments === "boolean" &&
		typeof candidate.submissionsEnabled === "boolean"
	);
}

function deepMergeSettings(base: RuntimeSettings, patch: Partial<RuntimeSettings>): RuntimeSettings {
	const next: RuntimeSettings = { ...base };
	if (typeof patch.enforceAuthForAllRoutes === "boolean") next.enforceAuthForAllRoutes = patch.enforceAuthForAllRoutes;
	if (typeof patch.enableStationComments === "boolean") next.enableStationComments = patch.enableStationComments;
	if (typeof patch.submissionsEnabled === "boolean") next.submissionsEnabled = patch.submissionsEnabled;
	if (Array.isArray(patch.allowedUnauthenticatedRoutes))
		next.allowedUnauthenticatedRoutes = patch.allowedUnauthenticatedRoutes.filter(isNonEmptyString) as NonEmptyString[];
	if (Array.isArray(patch.disabledRoutes)) next.disabledRoutes = patch.disabledRoutes.filter(isNonEmptyString) as NonEmptyString[];
	return next;
}

export async function initRuntimeSettings(): Promise<void> {
	if (initialized) return;
	try {
		const existing = await redis.get(SETTINGS_KEY);
		if (existing) {
			const parsed = JSON.parse(existing);
			inMemorySettings = isSettings(parsed) ? parsed : defaultSettings;
		} else {
			await redis.set(SETTINGS_KEY, JSON.stringify(defaultSettings));
			inMemorySettings = { ...defaultSettings };
		}
	} catch {
		inMemorySettings = { ...defaultSettings };
	}

	const subscriber = redis.duplicate();
	await subscriber.connect();
	await subscriber.subscribe(CHANNEL, (message) => {
		try {
			const parsed = JSON.parse(message);
			if (isSettings(parsed)) inMemorySettings = parsed;
		} catch {}
	});

	initialized = true;
}

export function getRuntimeSettings(): RuntimeSettings {
	return inMemorySettings;
}

export async function updateRuntimeSettings(patch: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
	const next = deepMergeSettings(inMemorySettings, patch);
	inMemorySettings = next;
	await redis.set(SETTINGS_KEY, JSON.stringify(next));
	const publisher = redis.duplicate();
	await publisher.connect();
	await publisher.publish(CHANNEL, JSON.stringify(next));
	await publisher.quit();
	return next;
}

export function getDefaultRuntimeSettings(): RuntimeSettings {
	return { ...defaultSettings };
}
