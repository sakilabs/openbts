import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveOperatorMnc, getOperatorColor, getOperatorSortIndex } from "@/lib/operatorUtils";
import type { StatsPermitRow, InternalPermitRow } from "../api";

function useBarData(rows: { operator: { name: string }; band: { name: string } }[] | undefined, valueKey: string) {
  return useMemo(() => {
    if (!rows?.length) return { chartData: [], operators: [] };

    const operatorSet = new Map<string, { name: string; color: string }>();
    const bandMap = new Map<string, Record<string, string | number>>();

    for (const row of rows) {
      if (!operatorSet.has(row.operator.name)) {
        const mnc = resolveOperatorMnc(null, row.operator.name);
        operatorSet.set(row.operator.name, {
          name: row.operator.name,
          color: mnc ? getOperatorColor(mnc) : "#94a3b8",
        });
      }

      const existing = bandMap.get(row.band.name) ?? { band: row.band.name };
      existing[row.operator.name] = (row as Record<string, unknown>)[valueKey] as number;
      bandMap.set(row.band.name, existing);
    }

    const operators = [...operatorSet.values()].sort(
      (a, b) => getOperatorSortIndex(resolveOperatorMnc(null, a.name)) - getOperatorSortIndex(resolveOperatorMnc(null, b.name)),
    );

    return { chartData: [...bandMap.values()], operators };
  }, [rows, valueKey]);
}

function BandBarChartCard({
  title,
  chartData,
  operators,
  locale,
}: {
  title: string;
  chartData: Record<string, unknown>[];
  operators: { name: string; color: string }[];
  locale?: string;
}) {
  const config = useMemo<ChartConfig>(() => Object.fromEntries(operators.map((op) => [op.name, { label: op.name, color: op.color }])), [operators]);

  if (!chartData.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} locale={locale} className="aspect-auto h-100 w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="band" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString(locale)} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {operators.map((op) => (
              <Bar key={op.name} dataKey={op.name} fill={op.color} />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function BandBarChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}

export function UkeBandBarChart({ data, isLoading }: { data?: StatsPermitRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { chartData, operators } = useBarData(data, "unique_stations");

  if (isLoading) return <BandBarChartSkeleton />;
  return <BandBarChartCard title={t("charts.byBand")} chartData={chartData} operators={operators} locale={i18n.language} />;
}

export function InternalBandBarChart({ data, isLoading }: { data?: InternalPermitRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { chartData, operators } = useBarData(data, "cells");

  if (isLoading) return <BandBarChartSkeleton />;
  return <BandBarChartCard title={t("charts.internalByBand")} chartData={chartData} operators={operators} locale={i18n.language} />;
}
