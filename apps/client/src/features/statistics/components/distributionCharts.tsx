import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveOperatorMnc, getOperatorColor, getOperatorSortIndex } from "@/lib/operatorUtils";
import type { StatsSummary } from "../api";

const RAT_COLORS: Record<string, string> = {
  LTE: "#3b82f6",
  NR: "#8b5cf6",
  GSM: "#22c55e",
  UMTS: "#f97316",
  CDMA: "#ef4444",
  IOT: "#06b6d4",
};

function DonutChart({ title, data, locale }: { title: string; data: { name: string; value: number; fill: string }[]; locale?: string }) {
  const config = useMemo<ChartConfig>(() => Object.fromEntries(data.map((d) => [d.name, { label: d.name, color: d.fill }])), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} locale={locale} className="mx-auto aspect-4/5 max-h-85">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function DistributionChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  );
}

export function UkeDistributionCharts({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");

  const ratData = useMemo(
    () =>
      data?.by_rat.map((r) => ({
        name: r.rat,
        value: r.unique_stations,
        fill: RAT_COLORS[r.rat] ?? "#94a3b8",
      })) ?? [],
    [data],
  );

  const operatorData = useMemo(
    () =>
      (data?.by_operator ?? [])
        .map((r) => {
          const mnc = resolveOperatorMnc(null, r.operator.name);
          return { name: r.operator.name, value: r.unique_stations, fill: mnc ? getOperatorColor(mnc) : "#94a3b8", mnc };
        })
        .sort((a, b) => getOperatorSortIndex(a.mnc) - getOperatorSortIndex(b.mnc)),
    [data],
  );

  if (isLoading) return <DistributionChartsSkeleton />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DonutChart title={t("charts.byRat")} data={ratData} locale={i18n.language} />
      <DonutChart title={t("charts.byOperator")} data={operatorData} locale={i18n.language} />
    </div>
  );
}

export function InternalDistributionCharts({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");

  const ratData = useMemo(
    () =>
      data?.internal.by_rat.map((r) => ({
        name: r.rat,
        value: r.cells,
        fill: RAT_COLORS[r.rat] ?? "#94a3b8",
      })) ?? [],
    [data],
  );

  const operatorData = useMemo(
    () =>
      (data?.internal.by_operator ?? [])
        .map((r) => {
          const mnc = resolveOperatorMnc(null, r.operator.name);
          return { name: r.operator.name, value: r.cells, fill: mnc ? getOperatorColor(mnc) : "#94a3b8", mnc };
        })
        .sort((a, b) => getOperatorSortIndex(a.mnc) - getOperatorSortIndex(b.mnc)),
    [data],
  );

  if (isLoading) return <DistributionChartsSkeleton />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DonutChart title={t("charts.internalByRat")} data={ratData} locale={i18n.language} />
      <DonutChart title={t("charts.internalByOperator")} data={operatorData} locale={i18n.language} />
    </div>
  );
}
