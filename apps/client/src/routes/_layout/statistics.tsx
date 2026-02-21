import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { UkeKpiCards, InternalKpiCards } from "@/features/statistics/components/kpiCards";
import { UkeDistributionCharts, InternalDistributionCharts } from "@/features/statistics/components/distributionCharts";
import { UkeBandBarChart, InternalBandBarChart } from "@/features/statistics/components/bandBarChart";
import { UkeVoivodeshipChart, InternalVoivodeshipChart } from "@/features/statistics/components/voivodeshipChart";
import { HistoryChart } from "@/features/statistics/components/historyChart";
import { statsSummaryQueryOptions, statsPermitsQueryOptions, statsVoivodeshipsQueryOptions } from "@/features/statistics/queries";
import { operatorsQueryOptions, bandsQueryOptions } from "@/features/shared/queries";

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
          <UkeDistributionCharts data={summary} isLoading={summaryLoading} />
          <UkeBandBarChart data={permits?.uke} isLoading={permitsLoading} />
          <UkeVoivodeshipChart data={voivodeships?.uke} isLoading={voivodeshipsLoading} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("main:stats.internalData")}</h2>
          <InternalKpiCards data={summary} isLoading={summaryLoading} />
          <InternalDistributionCharts data={summary} isLoading={summaryLoading} />
          <InternalBandBarChart data={permits?.internal} isLoading={permitsLoading} />
          <InternalVoivodeshipChart data={voivodeships?.internal} isLoading={voivodeshipsLoading} />
        </section>

        <HistoryChart operators={operators} bands={bands} />
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
