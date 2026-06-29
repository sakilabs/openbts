import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { InternalPermitRow, StatsOperator, StatsPermitRow } from "../api";
import { operatorDataKey, operatorSeries } from "../lib/series";
import { StatChartCard } from "./statChartCard";

function useBarData(rows: { operator: StatsOperator; band: { name: string } }[] | undefined, valueKey: string) {
  return useMemo(() => {
    if (!rows?.length) return { data: [], series: [] };

    const bandMap = new Map<string, Record<string, string | number>>();
    for (const row of rows) {
      const existing = bandMap.get(row.band.name) ?? { band: row.band.name };
      existing[operatorDataKey(row.operator)] = (row as Record<string, unknown>)[valueKey] as number;
      bandMap.set(row.band.name, existing);
    }

    return { data: [...bandMap.values()], series: operatorSeries(rows.map((row) => row.operator)) };
  }, [rows, valueKey]);
}

export function UkeBandBarChart({ data, isLoading }: { data?: StatsPermitRow[]; isLoading: boolean }) {
  const { t } = useTranslation("statistics");
  const { data: chartData, series } = useBarData(data, "unique_stations");

  return <StatChartCard title={t("charts.byBand")} data={chartData} series={series} dataXKey="band" stacked height="h-96" isLoading={isLoading} />;
}

export function InternalBandStationsBarChart({ data, isLoading }: { data?: InternalPermitRow[]; isLoading: boolean }) {
  const { t } = useTranslation("statistics");
  const { data: chartData, series } = useBarData(data, "stations");

  return (
    <StatChartCard
      title={t("charts.internalStationsByBand")}
      data={chartData}
      series={series}
      dataXKey="band"
      stacked
      height="h-96"
      isLoading={isLoading}
    />
  );
}
