import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleMapsIcon, AppleIcon, WazeIcon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { usePreferences, type GpsFormat, type NavigationApp, type NavLinksDisplay, type MapPointStyle } from "@/hooks/usePreferences";
import { toggleValue } from "@/lib/utils";
import { cn } from "@/lib/utils";

const GPS_FORMAT_OPTIONS: { value: GpsFormat; labelKey: string; example: string }[] = [
  { value: "decimal", labelKey: "preferences.gpsDecimal", example: "52.23157, 21.00672" },
  { value: "dms", labelKey: "preferences.gpsDms", example: "52°13'53.7\"N 21°00'24.2\"E" },
];

const NAVIGATION_APP_OPTIONS: { value: NavigationApp; labelKey: string; icon: typeof GoogleMapsIcon }[] = [
  { value: "google-maps", labelKey: "preferences.navGoogleMaps", icon: GoogleMapsIcon },
  { value: "apple-maps", labelKey: "preferences.navAppleMaps", icon: AppleIcon },
  { value: "waze", labelKey: "preferences.navWaze", icon: WazeIcon },
];

const MAP_POINT_STYLE_OPTIONS: { value: MapPointStyle; labelKey: string; descKey: string }[] = [
  { value: "dots", labelKey: "preferences.mapPointStyleDots", descKey: "preferences.mapPointStyleDotsDesc" },
  { value: "markers", labelKey: "preferences.mapPointStyleMarkers", descKey: "preferences.mapPointStyleMarkersDesc" },
];

const NAV_DISPLAY_OPTIONS: { value: NavLinksDisplay; labelKey: string; descKey: string }[] = [
  { value: "inline", labelKey: "preferences.navDisplayInline", descKey: "preferences.navDisplayInlineDesc" },
  { value: "buttons", labelKey: "preferences.navDisplayButtons", descKey: "preferences.navDisplayButtonsDesc" },
];

function PreferencesPage() {
  const { t } = useTranslation("settings");
  const { preferences, updatePreferences } = usePreferences();

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("preferences.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("preferences.description")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.gpsFormat")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.gpsFormatHint")}</p>
              <RadioGroup
                value={preferences.gpsFormat}
                onValueChange={(value) => updatePreferences({ gpsFormat: value as GpsFormat })}
                className="flex flex-col gap-1"
              >
                {GPS_FORMAT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`gps-${option.value}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      preferences.gpsFormat === option.value ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <RadioGroupItem id={`gps-${option.value}`} value={option.value} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{t(option.labelKey)}</span>
                      <span className="text-xs text-muted-foreground font-mono">{option.example}</span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.navigationApps")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.navigationAppsHint")}</p>
              <div className="flex flex-col gap-1">
                {NAVIGATION_APP_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`nav-${option.value}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      preferences.navigationApps.includes(option.value) ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <Checkbox
                      id={`nav-${option.value}`}
                      checked={preferences.navigationApps.includes(option.value)}
                      onCheckedChange={() =>
                        updatePreferences({
                          navigationApps: toggleValue(preferences.navigationApps, option.value),
                        })
                      }
                    />
                    <HugeiconsIcon icon={option.icon} className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t(option.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.navDisplayMode")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.navDisplayModeHint")}</p>
              <RadioGroup
                value={preferences.navLinksDisplay}
                onValueChange={(value) => updatePreferences({ navLinksDisplay: value as NavLinksDisplay })}
                className="flex flex-col gap-1"
              >
                {NAV_DISPLAY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`nav-display-${option.value}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      preferences.navLinksDisplay === option.value ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <RadioGroupItem id={`nav-display-${option.value}`} value={option.value} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{t(option.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(option.descKey)}</span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.radiolinesMinZoom")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.radiolinesMinZoomHint")}</p>
              <div className="flex items-center gap-4 px-3 py-2.5">
                <Slider
                  value={[preferences.radiolinesMinZoom]}
                  onValueChange={(value) => updatePreferences({ radiolinesMinZoom: Array.isArray(value) ? value[0] : value })}
                  min={7}
                  max={11}
                  step={0.1}
                />
                <span className="text-sm font-mono font-medium tabular-nums w-8 text-right shrink-0">{preferences.radiolinesMinZoom.toFixed(1)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.mapStationsLimit")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.mapStationsLimitHint")}</p>
              <div className="flex items-center gap-4 px-3 py-2.5">
                <Slider
                  value={[preferences.mapStationsLimit]}
                  onValueChange={(value) => updatePreferences({ mapStationsLimit: Array.isArray(value) ? value[0] : value })}
                  min={10}
                  max={1000}
                  step={10}
                />
                <span className="text-sm font-mono font-medium tabular-nums w-12 text-right shrink-0">{preferences.mapStationsLimit}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.mapRadiolinesLimit")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.mapRadiolinesLimitHint")}</p>
              <div className="flex items-center gap-4 px-3 py-2.5">
                <Slider
                  value={[preferences.mapRadiolinesLimit]}
                  onValueChange={(value) => updatePreferences({ mapRadiolinesLimit: Array.isArray(value) ? value[0] : value })}
                  min={10}
                  max={1000}
                  step={10}
                />
                <span className="text-sm font-mono font-medium tabular-nums w-12 text-right shrink-0">{preferences.mapRadiolinesLimit}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.mapHoverTooltip")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.mapHoverTooltipHint")}</p>
              <label
                htmlFor="hover-tooltip"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                  preferences.showMapHoverTooltip ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                <Checkbox
                  id="hover-tooltip"
                  checked={preferences.showMapHoverTooltip}
                  onCheckedChange={(checked) => updatePreferences({ showMapHoverTooltip: !!checked })}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t("preferences.mapHoverTooltipLabel")}</span>
                  <span className="text-xs text-muted-foreground">{t("preferences.mapHoverTooltipDesc")}</span>
                </div>
              </label>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("preferences.mapPointStyle")}</Label>
              <p className="text-xs text-muted-foreground">{t("preferences.mapPointStyleHint")}</p>
              <RadioGroup
                value={preferences.mapPointStyle}
                onValueChange={(v) => updatePreferences({ mapPointStyle: v as MapPointStyle })}
                className="flex flex-col gap-1"
              >
                {MAP_POINT_STYLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`map-point-style-${option.value}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      preferences.mapPointStyle === option.value ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <RadioGroupItem id={`map-point-style-${option.value}`} value={option.value} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{t(option.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(option.descKey)}</span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_layout/preferences")({
  component: PreferencesPage,
  staticData: {
    titleKey: "preferences.title",
    i18nNamespace: "settings",
    breadcrumbs: [{ titleKey: "secondary.settings", i18nNamespace: "nav" }],
  },
});
