import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleMapsIcon, AppleIcon, WazeIcon } from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { usePreferences, type GpsFormat, type NavigationApp, type NavLinksDisplay } from "@/hooks/usePreferences";
import { toggleValue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RouteHandle } from "./_layout";

export const handle: RouteHandle = {
	titleKey: "preferences.title",
	i18nNamespace: "settings",
	breadcrumbs: [{ titleKey: "secondary.settings", i18nNamespace: "nav" }],
};

const GPS_FORMAT_OPTIONS: { value: GpsFormat; labelKey: string; example: string }[] = [
	{ value: "decimal", labelKey: "preferences.gpsDecimal", example: "52.23157, 21.00672" },
	{ value: "dms", labelKey: "preferences.gpsDms", example: "52°13'53.7\"N 21°00'24.2\"E" },
];

const NAVIGATION_APP_OPTIONS: { value: NavigationApp; labelKey: string; icon: typeof GoogleMapsIcon }[] = [
	{ value: "google-maps", labelKey: "preferences.navGoogleMaps", icon: GoogleMapsIcon },
	{ value: "apple-maps", labelKey: "preferences.navAppleMaps", icon: AppleIcon },
	{ value: "waze", labelKey: "preferences.navWaze", icon: WazeIcon },
];

const NAV_DISPLAY_OPTIONS: { value: NavLinksDisplay; labelKey: string; descKey: string }[] = [
	{ value: "inline", labelKey: "preferences.navDisplayInline", descKey: "preferences.navDisplayInlineDesc" },
	{ value: "buttons", labelKey: "preferences.navDisplayButtons", descKey: "preferences.navDisplayButtonsDesc" },
];

export default function PreferencesPage() {
	const { t } = useTranslation("settings");
	const { preferences, updatePreferences } = usePreferences();

	return (
		<main className="flex-1 overflow-y-auto p-4">
			<div className="max-w-2xl space-y-8">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{t("preferences.title")}</h1>
					<p className="text-muted-foreground text-sm">{t("preferences.description")}</p>
				</div>

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
			</div>
		</main>
	);
}
