import type { CloudPreferences } from "@openbts/drizzle";
import { z } from "zod/v4";

export const userPreferencesSchema = z
  .object({
    gpsFormat: z.enum(["decimal", "dms"]),
    navigationApps: z.array(z.enum(["google-maps", "apple-maps", "waze", "osmand", "openstreetmap"])),
    navLinksDisplay: z.enum(["inline", "buttons"]),
    radiolinesMinZoom: z.number().min(7).max(11),
    mapStationsLimit: z.number().min(10).max(1000),
    mapRadiolinesLimit: z.number().min(10).max(1000),
    showMapHoverTooltip: z.boolean(),
    mapPointStyle: z.enum(["dots", "markers"]),
    mapRightClickMeasure: z.boolean(),
    mapMeasureCircle: z.boolean(),
    showStationPhotoPanel: z.boolean(),
    showElevation: z.boolean(),
    showAzimuths: z.boolean(),
    hideFiltersOnMapClick: z.boolean(),
    azimuthsMinZoom: z.number().min(10).max(19),
    azimuthLineLength: z.number().min(50).max(3000),
    azimuthSpread: z.number().min(0).max(120),
    cartoVariant: z.enum(["auto", "dark", "light"]),
  })
  .strict()
  .partial();

export const cloudPreferencesSchema = z.object({
  syncEnabled: z.boolean(),
  desktop: userPreferencesSchema.nullable(),
  mobile: userPreferencesSchema.nullable(),
});

export const cloudPreferencesPatchSchema = z
  .object({
    syncEnabled: z.boolean().optional(),
    desktop: userPreferencesSchema.nullable().optional(),
    mobile: userPreferencesSchema.nullable().optional(),
  })
  .strict();

export const DEFAULT_CLOUD_PREFERENCES: CloudPreferences = {
  syncEnabled: false,
  desktop: null,
  mobile: null,
};

export function normalizeCloudPreferences(value: CloudPreferences | null | undefined): CloudPreferences {
  if (value === undefined || value === null) return DEFAULT_CLOUD_PREFERENCES;

  return {
    syncEnabled: value.syncEnabled === true,
    desktop: value.desktop ?? null,
    mobile: value.mobile ?? null,
  };
}
