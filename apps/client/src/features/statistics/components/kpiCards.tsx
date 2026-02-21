import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsSummary } from "../api";

const RAT_ORDER = ["LTE", "NR", "UMTS", "GSM", "CDMA", "IOT"];

function formatNumber(n: number, locale?: string): string {
  return n.toLocaleString(locale);
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UkeKpiCards({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");

  if (isLoading) return <KpiSkeleton />;
  if (!data) return null;

  const sortedRats = [...data.by_rat].sort((a, b) => RAT_ORDER.indexOf(a.rat) - RAT_ORDER.indexOf(b.rat));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("kpi.totalPermits")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatNumber(data.total_permits, i18n.language)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("kpi.totalStations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatNumber(data.total_unique_stations, i18n.language)}</p>
        </CardContent>
      </Card>
      {sortedRats.map((rat) => (
        <Card key={rat.rat}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{rat.rat}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatNumber(rat.unique_stations, i18n.language)}</p>
            <p className="text-xs text-muted-foreground">
              {Number(rat.share_pct).toLocaleString(i18n.language, { maximumFractionDigits: 1 })}% ·{" "}
              {t("stationDetails:permits.permitsCount", { count: rat.permits, formatParams: { val: { lng: i18n.language } } })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function InternalKpiCards({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");

  if (isLoading) return <KpiSkeleton />;
  if (!data) return null;

  const sortedRats = [...data.internal.by_rat].sort((a, b) => RAT_ORDER.indexOf(a.rat) - RAT_ORDER.indexOf(b.rat));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("kpi.totalInternalStations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatNumber(data.internal.total_stations, i18n.language)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("kpi.totalCells")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatNumber(data.internal.total_cells, i18n.language)}</p>
        </CardContent>
      </Card>
      {sortedRats.map((rat) => (
        <Card key={rat.rat}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{rat.rat}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatNumber(rat.cells, i18n.language)}</p>
            <p className="text-xs text-muted-foreground">
              {Number(rat.share_pct).toLocaleString(i18n.language, { maximumFractionDigits: 1 })}% ·{" "}
              {t("stations:stationsCount", { count: rat.stations })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
