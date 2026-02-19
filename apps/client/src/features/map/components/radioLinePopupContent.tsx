import { memo } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { getOperatorColor, normalizeOperatorName, resolveOperatorMnc } from "@/lib/operatorUtils";
import { isPermitExpired } from "@/lib/dateUtils";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";
import { calculateDistance, formatDistance, formatFrequency, formatBandwidth, getLinkTypeStyle } from "../utils";
import type { DuplexRadioLink } from "../utils";
import { cn } from "@/lib/utils";

type RadioLinePopupContentProps = {
  link: DuplexRadioLink;
  coordinates: [number, number];
  onOpenDetails: (link: DuplexRadioLink) => void;
};

export const RadioLinePopupContent = memo(function RadioLinePopupContent({ link, coordinates, onOpenDetails }: RadioLinePopupContentProps) {
  const { t } = useTranslation(["main", "common"]);
  const { preferences } = usePreferences();

  const first = link.directions[0];
  const operatorName = first.operator?.name ?? t("unknownOperator");
  const mnc = resolveOperatorMnc(first.operator?.mnc, first.operator?.name);
  const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
  const distance = calculateDistance(link.a.latitude, link.a.longitude, link.b.latitude, link.b.longitude);
  const permitNumber = first.permit.number;
  const linkTypeStyle = getLinkTypeStyle(link.linkType);

  return (
    <div className="w-72 text-sm">
      <button type="button" className="w-full text-left px-3 py-2 hover:bg-muted/50 cursor-pointer" onClick={() => onOpenDetails(link)}>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="font-medium text-xs" style={{ color }}>
            {normalizeOperatorName(operatorName)}
          </span>
          {permitNumber && <span className="text-[10px] text-muted-foreground font-mono">{permitNumber}</span>}
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5 pl-3.5">
          <span className="px-1 py-px rounded-md bg-muted text-[8px] font-mono font-medium text-muted-foreground border border-border/50">
            {formatDistance(distance)}
          </span>
          {linkTypeStyle ? (
            <span
              className={cn(
                "px-1 py-px rounded-md text-[8px] font-semibold uppercase tracking-wider border",
                linkTypeStyle.bg,
                linkTypeStyle.text,
                linkTypeStyle.border,
              )}
            >
              {link.linkType}
            </span>
          ) : null}
          {link.isExpired && (
            <span className="px-1 py-px rounded-md bg-destructive/10 text-[8px] font-semibold uppercase tracking-wider text-destructive border border-destructive/20">
              {t("common:status.expired")}
            </span>
          )}
        </div>

        <div className="mt-2 pl-3.5 space-y-1.5">
          {link.directions.map((dir) => {
            const dirExpired = isPermitExpired(dir.permit.expiry_date);
            const isForward = dir.tx.latitude === link.a.latitude && dir.tx.longitude === link.a.longitude;
            return (
              <div key={dir.id} className="flex items-start gap-1.5">
                {link.directions.length > 1 && (
                  <span className="flex items-center gap-px text-[9px] font-bold text-muted-foreground shrink-0 leading-[18px]">
                    {isForward ? "A" : "B"}
                    <HugeiconsIcon icon={ArrowRight02Icon} className="size-2.5" />
                    {isForward ? "B" : "A"}
                  </span>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="px-1 py-px rounded-md bg-muted text-[8px] font-semibold tracking-wider text-muted-foreground border border-border/50">
                    {formatFrequency(dir.link.freq)}
                  </span>
                  {dir.link.polarization && (
                    <span className="px-1 py-px rounded-md bg-muted text-[8px] font-bold text-muted-foreground border border-border/50">
                      {dir.link.polarization}
                    </span>
                  )}
                  {dir.link.ch_width && (
                    <span className="px-1 py-px rounded-md bg-muted text-[8px] font-mono font-medium text-muted-foreground border border-border/50">
                      {dir.link.ch_width} MHz
                    </span>
                  )}
                  {dir.link.bandwidth && (
                    <span className="px-1 py-px rounded-md bg-muted text-[8px] font-mono font-medium text-muted-foreground border border-border/50">
                      {formatBandwidth(dir.link.bandwidth)}
                    </span>
                  )}
                  {dirExpired && <span className="size-1.5 rounded-full bg-destructive shrink-0 mt-1" title={t("common:status.expired")} />}
                </div>
              </div>
            );
          })}
        </div>
      </button>

      <div className="px-3 py-1.5 border-t border-border/50 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">
          GPS: {formatCoordinates(coordinates[1], coordinates[0], preferences.gpsFormat)}
        </span>
      </div>
    </div>
  );
});
