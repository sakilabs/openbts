import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { StatsSummary } from "../api";
import { operatorDataKey, operatorSeries } from "../lib/series";
import { StatChartCard } from "./statChartCard";

export function InternalOperatorStationsChart({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t } = useTranslation("statistics");

  const chart = useMemo(() => {
    if (!data?.internal.by_operator.length) return { data: [], series: operatorSeries([]) };
    return {
      data: [
        {
          metric: t("charts.internalStationsPerOperator"),
          ...data.internal.by_operator.reduce<Record<string, number>>((acc, row) => ({ ...acc, [operatorDataKey(row.operator)]: row.stations }), {}),
        },
      ],
      series: operatorSeries(data.internal.by_operator.map((row) => row.operator)),
    };
  }, [data, t]);

  return (
    <StatChartCard
      title={t("charts.internalStationsPerOperator")}
      data={chart.data}
      series={chart.series}
      dataXKey="metric"
      stacked
      isLoading={isLoading}
    />
  );
}
