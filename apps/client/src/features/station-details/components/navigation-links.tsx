import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleMapsIcon, AppleIcon, WazeIcon, MapsLocation01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { usePreferences, type NavigationApp } from "@/hooks/use-preferences";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

type NavigationLinksProps = {
	latitude: number;
	longitude: number;
	className?: string;
	displayMode?: "inline" | "buttons";
};

export const NAV_APP_CONFIG = {
	"google-maps": {
		label: "Google Maps",
		icon: GoogleMapsIcon,
		url: (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
	},
	"apple-maps": {
		label: "Apple Maps",
		icon: AppleIcon,
		url: (lat: number, lng: number) => `https://maps.apple.com/?q=${lat},${lng}`,
	},
	waze: {
		label: "Waze",
		icon: WazeIcon,
		url: (lat: number, lng: number) => `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`,
	},
} satisfies Record<NavigationApp, { label: string; icon: typeof GoogleMapsIcon; url: (lat: number, lng: number) => string }>;

export function NavigationLinks({ latitude, longitude, className, displayMode }: NavigationLinksProps) {
	const { t } = useTranslation("settings");
	const { preferences } = usePreferences();

	const mode = displayMode ?? preferences.navLinksDisplay;

	if (preferences.navigationApps.length === 0) return null;

	if (mode === "buttons") {
		return (
			<div className={className}>
				<div className="flex items-center gap-1.5 flex-wrap">
					{preferences.navigationApps.map((app) => {
						const config = NAV_APP_CONFIG[app];
						return (
							<Tooltip key={app}>
								<TooltipTrigger
									render={
										<button
											type="button"
											onClick={() => window.open(config.url(latitude, longitude), "_blank", "noreferrer")}
											className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
										/>
									}
								>
									<HugeiconsIcon icon={config.icon} className="size-3.5" />
									{config.label}
								</TooltipTrigger>
								<TooltipContent>{t("preferences.openWith", { app: config.label })}</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<span className={className}>
			<DropdownMenu>
				<Tooltip>
					<TooltipTrigger
						render={
							<DropdownMenuTrigger className="inline-flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer" />
						}
					>
						<HugeiconsIcon icon={MapsLocation01Icon} className="size-3.5" />
					</TooltipTrigger>
					<TooltipContent>{t("preferences.navigationApps")}</TooltipContent>
				</Tooltip>
				<DropdownMenuContent align="start" sideOffset={4} className="min-w-48">
					{preferences.navigationApps.map((app) => {
						const config = NAV_APP_CONFIG[app];
						return (
							<DropdownMenuItem
								key={app}
								onClick={() => window.open(config.url(latitude, longitude), "_blank", "noreferrer")}
								className="cursor-pointer"
							>
								<HugeiconsIcon icon={config.icon} className="size-4" />
								{t("preferences.openWith", { app: config.label })}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</span>
	);
}
