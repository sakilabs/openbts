import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  useChart,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveOperatorMnc, getOperatorColor, getOperatorSortIndex } from "@/lib/operatorUtils";
import { statsHistoryQueryOptions } from "../queries";
import type { StatsHistoryRow } from "../api";
import type { Operator } from "@/types/station";

interface BandChartData {
  bandName: string;
  chartData: Record<string, string | number>[];
  operators: { name: string; color: string }[];
}

function useBandCharts(historyData: StatsHistoryRow[] | undefined): BandChartData[] {
  return useMemo(() => {
    if (!historyData?.length) return [];

    const bandGroups = new Map<string, StatsHistoryRow[]>();
    for (const row of historyData) {
      const group = bandGroups.get(row.band.name) ?? [];
      group.push(row);
      bandGroups.set(row.band.name, group);
    }

    return [...bandGroups.entries()].map(([bandName, rows]) => {
      const dateMap = new Map<string, Record<string, string | number>>();
      const operatorSet = new Map<string, { name: string; color: string }>();

      for (const row of rows) {
        if (!operatorSet.has(row.operator.name)) {
          const mnc = resolveOperatorMnc(null, row.operator.name);
          operatorSet.set(row.operator.name, {
            name: row.operator.name,
            color: mnc ? getOperatorColor(mnc) : "#94a3b8",
          });
        }

        const existing = dateMap.get(row.date) ?? { date: row.date };
        existing[row.operator.name] = row.unique_stations;
        dateMap.set(row.date, existing);
      }

      const operators = [...operatorSet.values()].sort(
        (a, b) => getOperatorSortIndex(resolveOperatorMnc(null, a.name)) - getOperatorSortIndex(resolveOperatorMnc(null, b.name)),
      );

      const sorted = [...dateMap.values()].sort((a, b) => (a.date as string).localeCompare(b.date as string));

      for (let i = 1; i < sorted.length; i++) {
        for (const op of operators) {
          const cur = sorted[i][op.name] as number | undefined;
          const prev = sorted[i - 1][op.name] as number | undefined;
          if (cur != null && prev != null && prev !== 0) {
            sorted[i][`${op.name}_change`] = ((cur - prev) / prev) * 100;
          }
        }
      }

      return { bandName, chartData: sorted, operators };
    });
  }, [historyData]);
}

function HistoryTooltipContent(props: ComponentProps<typeof ChartTooltipContent>) {
  const { locale } = useChart();
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name, item) => {
        const change = item.payload[`${name}_change`] as number | undefined;
        return (
          <div className="flex w-full items-center gap-2">
            <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground flex-1">{name}</span>
            <span className="font-mono font-medium tabular-nums">{(value as number).toLocaleString(locale)}</span>
            {change != null && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground",
                )}
              >
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            )}
          </div>
        );
      }}
    />
  );
}

function BandHistoryCard({ band, locale }: { band: BandChartData; locale: string }) {
  const config = useMemo<ChartConfig>(
    () => Object.fromEntries(band.operators.map((op) => [op.name, { label: op.name, color: op.color }])),
    [band.operators],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{band.bandName}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} locale={locale} className="aspect-auto h-56 w-full">
          <LineChart accessibilityLayer data={band.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString(locale)} />
            <ChartTooltip content={<HistoryTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {band.operators.map((op) => (
              <Line key={op.name} type="monotone" dataKey={op.name} stroke={op.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function HistoryChart({ operators }: { operators?: Operator[] }) {
  const { t, i18n } = useTranslation("statistics");
  const [operatorId, setOperatorId] = useState<number | undefined>();
  const [granularity, setGranularity] = useState<"monthly" | "daily">("monthly");

  const { data: historyData, isLoading } = useQuery(statsHistoryQueryOptions({ operator_id: operatorId, granularity }));
  const bandCharts = useBandCharts(historyData);

  const operatorItems = useMemo(
    () => [{ value: "all", label: t("filters.allOperators") }, ...(operators?.map((op) => ({ value: String(op.id), label: op.name })) ?? [])],
    [operators, t],
  );

  const granularityItems = useMemo(
    () => [
      { value: "monthly" as const, label: t("filters.monthly") },
      { value: "daily" as const, label: t("filters.daily") },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold">{t("charts.history")}</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">{t("common:labels.operator")}</span>
            <Select
              value={operatorId ? String(operatorId) : "all"}
              onValueChange={(v) => setOperatorId(v === "all" ? undefined : Number(v))}
              items={operatorItems}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allOperators")}</SelectItem>
                {operators?.map((op) => (
                  <SelectItem key={op.id} value={String(op.id)}>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">{t("filters.granularity")}</span>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as "monthly" | "daily")} items={granularityItems}>
              <SelectTrigger className="w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t("filters.monthly")}</SelectItem>
                <SelectItem value="daily">{t("filters.daily")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-56 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bandCharts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-56 text-muted-foreground">{t("charts.noHistoryData")}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bandCharts.map((band) => (
            <BandHistoryCard key={band.bandName} band={band} locale={i18n.language} />
          ))}
        </div>
      )}
    </div>
  );
}
