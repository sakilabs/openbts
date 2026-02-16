import { useSyncExternalStore, useCallback } from "react";

export type GpsFormat = "decimal" | "dms";
export type NavigationApp = "google-maps" | "apple-maps" | "waze";
export type NavLinksDisplay = "inline" | "buttons";

export interface UserPreferences {
	gpsFormat: GpsFormat;
	navigationApps: NavigationApp[];
	navLinksDisplay: NavLinksDisplay;
	radiolinesMinZoom: number;
	mapStationsLimit: number;
	mapRadiolinesLimit: number;
}

const STORAGE_KEY = "user-preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
	gpsFormat: "decimal",
	navigationApps: ["google-maps"],
	navLinksDisplay: "inline",
	radiolinesMinZoom: 8,
	mapStationsLimit: 1000,
	mapRadiolinesLimit: 500,
};

let listeners: Array<() => void> = [];
let cachedSnapshot: UserPreferences | null = null;
let cachedRaw: string | null = null;

function emitChange() {
	cachedSnapshot = null;
	cachedRaw = null;
	for (const listener of listeners) {
		listener();
	}
}

function getSnapshot(): UserPreferences {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === cachedRaw && cachedSnapshot) {
			return cachedSnapshot;
		}
		if (stored) {
			cachedRaw = stored;
			const parsed = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } as UserPreferences;
			cachedSnapshot = parsed;
			return parsed;
		}
	} catch {
		// ignore
	}
	cachedRaw = null;
	cachedSnapshot = DEFAULT_PREFERENCES;
	return DEFAULT_PREFERENCES;
}

function subscribe(listener: () => void) {
	listeners = [...listeners, listener];
	return () => {
		listeners = listeners.filter((l) => l !== listener);
	};
}

function setPreferences(update: Partial<UserPreferences>) {
	const current = getSnapshot();
	const next = { ...current, ...update };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	emitChange();
}

export function usePreferences() {
	const preferences = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PREFERENCES);

	const updatePreferences = useCallback((update: Partial<UserPreferences>) => {
		setPreferences(update);
	}, []);

	return { preferences, updatePreferences };
}

export function getPreferences(): UserPreferences {
	return getSnapshot();
}
