import { type ComponentProps, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { getOperatorColor, getOperatorSortIndex, resolveOperatorMnc } from "@/lib/operatorUtils";

import type { InternalPermitRow, StatsPermitRow } from "../api";
import { operatorSeries } from "../lib/series";
import { StatChartCard } from "./statChartCard";

function useBarData(rows: { operator: { name: string }; band: { name: string } }[] | undefined, valueKey: string) {
  return useMemo(() => {
    if (!rows?.length) return { data: [], series: [] };

    const bandMap = new Map<string, Record<string, string | number>>();
    for (const row of rows) {
      const existing = bandMap.get(row.band.name) ?? { band: row.band.name };
      existing[row.operator.name] = (row as Record<string, unknown>)[valueKey] as number;
      bandMap.set(row.band.name, existing);
    }

    return { data: [...bandMap.values()], series: operatorSeries(rows.map((row) => row.operator.name)) };
  }, [rows, valueKey]);
}

export function UkeBandBarChart({ data, isLoading }: { data?: StatsPermitRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { data: chartData, series } = useBarData(data, "unique_stations");

  return <StatChartCard title={t("charts.byBand")} data={chartData} series={series} dataXKey="band" stacked height="h-96" isLoading={isLoading} />;
}

export function InternalBandStationsBarChart({ data, isLoading }: { data?: InternalPermitRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { data: chartData, series } = useBarData(data, "stations");

  return <StatChartCard title={t("charts.byBand")} data={chartData} series={series} dataXKey="band" stacked height="h-96" isLoading={isLoading} />;
}

export function InternalBandBarChart({ data, isLoading }: { data?: InternalPermitRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { data: chartData, series } = useBarData(data, "cells");

  return <StatChartCard title={t("charts.byBand")} data={chartData} series={series} dataXKey="band" stacked height="h-96" isLoading={isLoading} />;
}
