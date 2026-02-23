import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { UkeKpiCards, InternalKpiCards } from "@/features/statistics/components/kpiCards";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { statsSummaryQueryOptions, statsPermitsQueryOptions, statsVoivodeshipsQueryOptions } from "@/features/statistics/queries";
import { operatorsQueryOptions, bandsQueryOptions } from "@/features/shared/queries";

const UkeDistributionCharts = lazy(() =>
  import("@/features/statistics/components/distributionCharts").then((m) => ({ default: m.UkeDistributionCharts })),
);
const InternalDistributionCharts = lazy(() =>
  import("@/features/statistics/components/distributionCharts").then((m) => ({ default: m.InternalDistributionCharts })),
);
const UkeBandBarChart = lazy(() => import("@/features/statistics/components/bandBarChart").then((m) => ({ default: m.UkeBandBarChart })));
const InternalBandBarChart = lazy(() => import("@/features/statistics/components/bandBarChart").then((m) => ({ default: m.InternalBandBarChart })));
const UkeVoivodeshipChart = lazy(() => import("@/features/statistics/components/voivodeshipChart").then((m) => ({ default: m.UkeVoivodeshipChart })));
const InternalVoivodeshipChart = lazy(() =>
  import("@/features/statistics/components/voivodeshipChart").then((m) => ({ default: m.InternalVoivodeshipChart })),
);
const HistoryChart = lazy(() => import("@/features/statistics/components/historyChart").then((m) => ({ default: m.HistoryChart })));

function ChartCardSkeleton({ contentClassName }: { contentClassName?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className={contentClassName ?? "h-96 w-full"} />
      </CardContent>
    </Card>
  );
}

function DistributionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartCardSkeleton contentClassName="h-64 w-full" />
      <ChartCardSkeleton contentClassName="h-64 w-full" />
    </div>
  );
}

function StatisticsPage() {
  const { t } = useTranslation("statistics");
  const { data: summary, isLoading: summaryLoading } = useQuery(statsSummaryQueryOptions());
  const { data: permits, isLoading: permitsLoading } = useQuery(statsPermitsQueryOptions());
  const { data: voivodeships, isLoading: voivodeshipsLoading } = useQuery(statsVoivodeshipsQueryOptions());
  const { data: operators } = useQuery(operatorsQueryOptions());
  const { data: bands } = useQuery(bandsQueryOptions());

  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("stationDetails:tabs.permits")}</h2>
          <UkeKpiCards data={summary} isLoading={summaryLoading} />
          <Suspense fallback={<DistributionSkeleton />}>
            <UkeDistributionCharts data={summary} isLoading={summaryLoading} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton />}>
            <UkeBandBarChart data={permits?.uke} isLoading={permitsLoading} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton contentClassName="h-140 w-full" />}>
            <UkeVoivodeshipChart data={voivodeships?.uke} isLoading={voivodeshipsLoading} />
          </Suspense>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("main:stats.internalData")}</h2>
          <InternalKpiCards data={summary} isLoading={summaryLoading} />
          <Suspense fallback={<DistributionSkeleton />}>
            <InternalDistributionCharts data={summary} isLoading={summaryLoading} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton />}>
            <InternalBandBarChart data={permits?.internal} isLoading={permitsLoading} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton contentClassName="h-140 w-full" />}>
            <InternalVoivodeshipChart data={voivodeships?.internal} isLoading={voivodeshipsLoading} />
          </Suspense>
        </section>

        <Suspense fallback={<ChartCardSkeleton />}>
          <HistoryChart operators={operators} bands={bands} />
        </Suspense>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_layout/statistics")({
  component: StatisticsPage,
  staticData: {
    titleKey: "items.statistics",
    i18nNamespace: "nav",
    breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
  },
});
