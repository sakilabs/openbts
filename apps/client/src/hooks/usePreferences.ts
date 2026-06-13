import { useCallback, useSyncExternalStore } from "react";

export type GpsFormat = "decimal" | "dms";
export type NavigationApp = "google-maps" | "apple-maps" | "waze" | "osmand" | "openstreetmap";
export type NavLinksDisplay = "inline" | "buttons";
export type MapPointStyle = "dots" | "markers";
export type CartoVariant = "auto" | "dark" | "light";

export interface UserPreferences {
  gpsFormat: GpsFormat;
  navigationApps: NavigationApp[];
  navLinksDisplay: NavLinksDisplay;
  radiolinesMinZoom: number;
  mapStationsLimit: number;
  mapRadiolinesLimit: number;
  showMapHoverTooltip: boolean;
  mapPointStyle: MapPointStyle;
  mapRightClickMeasure: boolean;
  mapMeasureCircle: boolean;
  showStationPhotoPanel: boolean;
  showElevation: boolean;
  showAzimuths: boolean;
  hideFiltersOnMapClick: boolean;
  azimuthsMinZoom: number;
  azimuthLineLength: number;
  azimuthSpread: number;
  cartoVariant: CartoVariant;
}

const STORAGE_KEY = "user-preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  gpsFormat: "decimal",
  navigationApps: ["google-maps"],
  navLinksDisplay: "inline",
  radiolinesMinZoom: 8,
  mapStationsLimit: 1000,
  mapRadiolinesLimit: 500,
  showMapHoverTooltip: false,
  mapPointStyle: "dots",
  mapRightClickMeasure: false,
  mapMeasureCircle: false,
  showStationPhotoPanel: true,
  showElevation: false,
  showAzimuths: false,
  hideFiltersOnMapClick: false,
  azimuthsMinZoom: 14,
  azimuthLineLength: 200,
  azimuthSpread: 60,
  cartoVariant: "light",
};

let listeners: Array<() => void> = [];
let cachedSnapshot: UserPreferences | null = null;
let cachedRaw: string | null = null;
let isStorageListenerActive = false;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function invalidateSnapshot() {
  cachedSnapshot = null;
  cachedRaw = null;
  emitChange();
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  invalidateSnapshot();
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
  if (!isStorageListenerActive && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
    isStorageListenerActive = true;
  }
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    if (listeners.length === 0 && isStorageListenerActive && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageChange);
      isStorageListenerActive = false;
    }
  };
}

function setPreferences(update: Partial<UserPreferences>) {
  const current = getSnapshot();
  const next = { ...current, ...update };
  const nextRaw = JSON.stringify(next);
  const currentRaw = cachedRaw ?? JSON.stringify(current);
  if (nextRaw === currentRaw) return;
  localStorage.setItem(STORAGE_KEY, nextRaw);
  cachedSnapshot = next;
  cachedRaw = nextRaw;
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
