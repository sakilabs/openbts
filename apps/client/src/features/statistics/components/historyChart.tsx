import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveOperatorMnc, getOperatorColor } from "@/lib/operatorUtils";
import { statsHistoryQueryOptions } from "../queries";
import type { Operator, Band } from "@/types/station";

export function HistoryChart({ operators, bands }: { operators?: Operator[]; bands?: Band[] }) {
  const { t, i18n } = useTranslation("statistics");
  const [operatorId, setOperatorId] = useState<number | undefined>();
  const [bandId, setBandId] = useState<number | undefined>();
  const [granularity, setGranularity] = useState<"monthly" | "daily">("monthly");

  const { data: historyData, isLoading } = useQuery(statsHistoryQueryOptions({ operator_id: operatorId, band_id: bandId, granularity }));

  const { chartData, lineKeys } = useMemo(() => {
    if (!historyData?.length) return { chartData: [], lineKeys: [] };

    const dateMap = new Map<string, Record<string, number | string>>();
    const keys = new Set<string>();

    for (const row of historyData) {
      const key = `${row.operator.name} - ${row.band.name}`;
      keys.add(key);

      const existing = dateMap.get(row.date) ?? { date: row.date };
      existing[key] = row.unique_stations;
      dateMap.set(row.date, existing);
    }

    return {
      chartData: [...dateMap.values()].sort((a, b) => (a.date as string).localeCompare(b.date as string)),
      lineKeys: [...keys],
    };
  }, [historyData]);

  const getLineColor = (key: string) => {
    const operatorName = key.split(" - ")[0];
    const mnc = resolveOperatorMnc(null, operatorName);
    return mnc ? getOperatorColor(mnc) : "#94a3b8";
  };

  const lineConfig = useMemo<ChartConfig>(
    () => Object.fromEntries(lineKeys.map((key) => [key, { label: key, color: getLineColor(key) }])),
    [lineKeys],
  );

  const operatorItems = useMemo(
    () => [{ value: "all", label: t("filters.allOperators") }, ...(operators?.map((op) => ({ value: String(op.id), label: op.name })) ?? [])],
    [operators, t],
  );

  const bandItems = useMemo(
    () => [{ value: "all", label: t("filters.allBands") }, ...(bands?.map((b) => ({ value: String(b.id), label: b.name })) ?? [])],
    [bands, t],
  );

  const granularityItems = useMemo(
    () => [
      { value: "monthly" as const, label: t("filters.monthly") },
      { value: "daily" as const, label: t("filters.daily") },
    ],
    [t],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("charts.history")}</CardTitle>
        <CardAction>
          <div className="flex items-center gap-4">
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
              <span className="text-sm text-muted-foreground">{t("common:labels.band")}</span>
              <Select value={bandId ? String(bandId) : "all"} onValueChange={(v) => setBandId(v === "all" ? undefined : Number(v))} items={bandItems}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allBands")}</SelectItem>
                  {bands?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
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
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">{t("charts.noHistoryData")}</div>
        ) : (
          <ChartContainer config={lineConfig} locale={i18n.language} className="aspect-auto h-100 w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString(i18n.language)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {lineKeys.map((key) => (
                <Line key={key} type="monotone" dataKey={key} stroke={getLineColor(key)} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
