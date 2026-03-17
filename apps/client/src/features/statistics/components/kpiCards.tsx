import { useCallback, useRef, useState } from "react";
import NumberFlow, { continuous } from "@number-flow/react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsSummary } from "../api";

const RAT_ORDER = ["LTE", "NR", "UMTS", "GSM", "CDMA", "IOT"];

function magnitudeFloor(n: number): number {
  if (n <= 0) return 0;
  return Math.pow(10, Math.floor(Math.log10(n)));
}

const FLOW_PROPS = {
  plugins: [continuous],
  transformTiming: { duration: 1200, easing: "ease-out" },
  spinTiming: { duration: 1200, easing: "ease-out" },
  opacityTiming: { duration: 400, easing: "ease-out" },
};

function useContainerVisible() {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(el);
  }, []);

  return { ref, visible };
}

function KpiSkeleton() {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-4 py-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-14" />
        </div>
      ))}
    </div>
  );
}

export function UkeKpiCards({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { ref, visible } = useContainerVisible();

  if (isLoading) return <KpiSkeleton />;
  if (!data) return null;

  const sortedRats = [...data.by_rat].sort((a, b) => RAT_ORDER.indexOf(a.rat) - RAT_ORDER.indexOf(b.rat));

  return (
    <div ref={ref} className="flex flex-wrap gap-x-10 gap-y-4 py-1">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t("kpi.totalPermits")}</p>
        <p className="text-2xl font-bold tabular-nums">
          <NumberFlow {...FLOW_PROPS} value={visible ? data.total_permits : magnitudeFloor(data.total_permits)} locales={i18n.language} />
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t("kpi.totalStations")}</p>
        <p className="text-2xl font-bold tabular-nums">
          <NumberFlow
            {...FLOW_PROPS}
            value={visible ? data.total_unique_stations : magnitudeFloor(data.total_unique_stations)}
            locales={i18n.language}
          />
        </p>
      </div>
      <div className="w-px self-stretch bg-border shrink-0 hidden sm:block" />
      {sortedRats.map((rat) => (
        <div key={rat.rat}>
          <p className="text-xs text-muted-foreground mb-1">{rat.rat}</p>
          <p className="text-2xl font-bold tabular-nums">
            <NumberFlow {...FLOW_PROPS} value={visible ? rat.unique_stations : magnitudeFloor(rat.unique_stations)} locales={i18n.language} />
          </p>
          <p className="text-xs text-muted-foreground">
            {Number(rat.share_pct).toLocaleString(i18n.language, { maximumFractionDigits: 1 })}% ·{" "}
            {t("stationDetails:permits.permitsCount", { count: rat.permits, formatParams: { val: { lng: i18n.language } } })}
          </p>
        </div>
      ))}
    </div>
  );
}

export function InternalKpiCards({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { ref, visible } = useContainerVisible();

  if (isLoading) return <KpiSkeleton />;
  if (!data) return null;

  const sortedRats = [...data.internal.by_rat].sort((a, b) => RAT_ORDER.indexOf(a.rat) - RAT_ORDER.indexOf(b.rat));

  return (
    <div ref={ref} className="flex flex-wrap gap-x-10 gap-y-4 py-1">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t("kpi.totalInternalStations")}</p>
        <p className="text-2xl font-bold tabular-nums">
          <NumberFlow
            {...FLOW_PROPS}
            value={visible ? data.internal.total_stations : magnitudeFloor(data.internal.total_stations)}
            locales={i18n.language}
          />
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t("kpi.totalCells")}</p>
        <p className="text-2xl font-bold tabular-nums">
          <NumberFlow
            {...FLOW_PROPS}
            value={visible ? data.internal.total_cells : magnitudeFloor(data.internal.total_cells)}
            locales={i18n.language}
          />
        </p>
      </div>
      <div className="w-px self-stretch bg-border shrink-0 hidden sm:block" />
      {sortedRats.map((rat) => (
        <div key={rat.rat}>
          <p className="text-xs text-muted-foreground mb-1">{rat.rat}</p>
          <p className="text-2xl font-bold tabular-nums">
            <NumberFlow {...FLOW_PROPS} value={visible ? rat.cells : magnitudeFloor(rat.cells)} locales={i18n.language} />
          </p>
          <p className="text-xs text-muted-foreground">
            {Number(rat.share_pct).toLocaleString(i18n.language, { maximumFractionDigits: 1 })}% ·{" "}
            {t("stations:stationsCount", { count: rat.stations })}
          </p>
        </div>
      ))}
    </div>
  );
}
