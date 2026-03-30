import { lazy, memo, Suspense, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, Share08Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { getOperatorColor, normalizeOperatorName, resolveOperatorMnc } from "@/lib/operatorUtils";
import { isPermitExpired } from "@/lib/dateUtils";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";
import {
  calculateDistance,
  formatDistance,
  formatFrequency,
  formatBandwidth,
  formatSpeed,
  getLinkTypeStyle,
  buildRadiolineShareUrl,
  calculateRadiolineSpeed,
  calculateLinkTotalSpeed,
} from "../utils";
import type { DuplexRadioLink } from "../utils";
import { cn } from "@/lib/utils";

const AddToListPopover = lazy(() => import("@/features/lists/components/addToListPopover").then((m) => ({ default: m.AddToListPopover })));

function PopupShareButton({ link }: { link: DuplexRadioLink }) {
  const { t } = useTranslation(["common"]);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const shareUrl = buildRadiolineShareUrl(link);
    if (navigator.share) {
      const operatorName = link.directions[0].operator?.name ?? "";
      void navigator
        .share({
          title: `${operatorName} - ${formatFrequency(link.directions[0].link.freq)}`,
          url: shareUrl,
        })
        .then(() => {})
        .catch((error: unknown) => {
          if ((error as Error).name === "AbortError") return;
        });
      return;
    }

    void navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
      });
  }, [link]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="p-0.5 hover:bg-muted rounded transition-colors cursor-pointer shrink-0"
      aria-label={t("common:actions.share")}
    >
      {copied ? (
        <HugeiconsIcon icon={Tick02Icon} className="size-3 text-emerald-500" />
      ) : (
        <HugeiconsIcon icon={Share08Icon} className="size-3 text-muted-foreground" />
      )}
    </button>
  );
}

type RadioLinePopupContentProps = {
  link: DuplexRadioLink;
  coordinates: [number, number];
  showAddToList?: boolean;
  onOpenDetails: (link: DuplexRadioLink) => void;
};

export const RadioLinePopupContent = memo(function RadioLinePopupContent({
  link,
  coordinates,
  showAddToList = false,
  onOpenDetails,
}: RadioLinePopupContentProps) {
  const { t } = useTranslation(["main", "common"]);
  const { preferences } = usePreferences();

  const first = link.directions[0];
  const operatorName = first.operator?.name ?? t("unknownOperator");
  const mnc = resolveOperatorMnc(first.operator?.mnc, first.operator?.name);
  const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
  const distance = calculateDistance(link.a.latitude, link.a.longitude, link.b.latitude, link.b.longitude);
  const permitNumber = first.permit.number;
  const linkTypeStyle = getLinkTypeStyle(link.linkType);
  const totalSpeed = calculateLinkTotalSpeed(link);

  return (
    <div className="w-72 text-sm">
      <button type="button" className="w-full text-left px-3 py-2 hover:bg-muted/50 cursor-pointer" onClick={() => onOpenDetails(link)}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="size-2 rounded-[2px] shrink-0" style={{ backgroundColor: color }} />
          <span className="font-medium text-xs truncate">
            {normalizeOperatorName(operatorName)}
          </span>
          {permitNumber && <span className="text-[9px] text-muted-foreground font-mono shrink-0">{permitNumber}</span>}
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5 pl-3.5">
          <span className="px-1 py-px rounded-md bg-muted text-[9px] font-mono font-medium text-muted-foreground border border-border/50">
            {formatDistance(distance)}
          </span>
          {linkTypeStyle ? (
            <span
              className={cn(
                "px-1 py-px rounded-md text-[8px] uppercase tracking-wider border",
                linkTypeStyle.bg,
                linkTypeStyle.text,
                linkTypeStyle.border,
              )}
            >
              {link.linkType}
            </span>
          ) : null}
          {totalSpeed !== null && totalSpeed !== undefined ? (
            <span className="px-1 py-px rounded-md bg-emerald-500/10 text-[9px] font-mono font-semibold text-emerald-600 border border-emerald-500/20">
              {formatSpeed(totalSpeed)}
            </span>
          ) : null}
          {link.isExpired && (
            <span className="px-1 py-px rounded-md bg-destructive/10 text-[9px] font-semibold uppercase tracking-wider text-destructive border border-destructive/20">
              {t("common:status.expired")}
            </span>
          )}
        </div>

        <div className="mt-2 pl-3.5 space-y-1.5">
          {link.directions.map((dir) => {
            const dirExpired = isPermitExpired(dir.permit.expiry_date);
            const isForward = dir.tx.latitude === link.a.latitude && dir.tx.longitude === link.a.longitude;
            const dirCalcSpeed =
              dir.link.ch_width && dir.link.modulation_type ? calculateRadiolineSpeed(dir.link.ch_width, dir.link.modulation_type) : null;
            const dirSpeedBadge = (() => {
              if (dirCalcSpeed !== null && dirCalcSpeed !== undefined)
                return (
                  <span className="px-1 py-px rounded-md bg-emerald-500/10 text-[9px] font-mono font-medium text-emerald-600 border border-emerald-500/20">
                    {formatSpeed(dirCalcSpeed)}
                  </span>
                );
              if (dir.link.bandwidth)
                return (
                  <span className="px-1 py-px rounded-md bg-muted text-[9px] font-mono font-medium text-muted-foreground border border-border/50">
                    {formatBandwidth(dir.link.bandwidth)}
                  </span>
                );
              return null;
            })();
            return (
              <div key={dir.id} className="flex items-start gap-1.5">
                {link.directions.length > 1 && (
                  <span className="flex items-center gap-px text-[8px] font-bold text-muted-foreground shrink-0 leading-4.5">
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
                  {dirSpeedBadge}
                  {dirExpired && <span className="size-1.5 rounded-full bg-destructive shrink-0 mt-1" title={t("common:status.expired")} />}
                </div>
              </div>
            );
          })}
        </div>
      </button>

      <div className="px-3 py-1.5 border-t border-border/50 flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground font-mono flex-1">
          GPS: {formatCoordinates(coordinates[1], coordinates[0], preferences.gpsFormat)}
        </span>
        {showAddToList && (
          <Suspense>
            <AddToListPopover radiolineIds={link.directions.map((d) => d.id)} />
          </Suspense>
        )}
        <PopupShareButton link={link} />
      </div>
    </div>
  );
});
