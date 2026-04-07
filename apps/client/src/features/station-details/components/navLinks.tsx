import { AppleIcon, GoogleMapsIcon, MapsLocation01Icon, WazeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslation } from "react-i18next";
import type { JSX } from "react/jsx-runtime";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type NavigationApp, usePreferences } from "@/hooks/usePreferences";

type NavIconComponent = (props: { className?: string }) => JSX.Element;

const hugeIcon = (icon: typeof GoogleMapsIcon): NavIconComponent => {
  function NavHugeIcon({ className }: { className?: string }) {
    return <HugeiconsIcon icon={icon} className={className} />;
  }
  return NavHugeIcon;
};

const GoogleMapsNavIcon = hugeIcon(GoogleMapsIcon);
const AppleNavIcon = hugeIcon(AppleIcon);
const WazeNavIcon = hugeIcon(WazeIcon);

export function OsmAndIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 1000" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        d="m598.32963 913.706-84.95 80.979a19.593 19.593 0 0 1 -26.784 0l-84.947-80.978c-207.9-45.1-363.672001-230.086-363.672001-451.553 0-255.237 206.849001-462.15399485 462.011001-462.15399485s462.012 206.91699485 462.012 462.15399485c0 221.466-155.771 406.451-363.67 451.552zm-98.318-715.649c-145.786 0-263.971 118.208-263.971 264.036s118.185 264.039 263.971 264.039 263.976-118.217 263.976-264.039-118.19-264.036-263.976-264.036z"
      />
    </svg>
  );
}

type NavigationLinksProps = {
  latitude: number;
  longitude: number;
  className?: string;
  displayMode?: "inline" | "buttons";
};

export const NAV_APP_CONFIG: Record<NavigationApp, { label: string; Icon: NavIconComponent; url: (lat: number, lng: number) => string }> = {
  "google-maps": {
    label: "Google Maps",
    Icon: GoogleMapsNavIcon,
    url: (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  },
  "apple-maps": {
    label: "Apple Maps",
    Icon: AppleNavIcon,
    url: (lat, lng) => `https://maps.apple.com/?q=${lat},${lng}`,
  },
  waze: {
    label: "Waze",
    Icon: WazeNavIcon,
    url: (lat, lng) => `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  },
  osmand: {
    label: "OsmAnd",
    Icon: OsmAndIcon,
    url: (lat, lng) => `https://osmand.net/go?lat=${lat}&lon=${lng}&z=16`,
  },
};

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
                  <config.Icon className="size-3.5" />
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
                <config.Icon className="size-4" />
                {t("preferences.openWith", { app: config.label })}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
