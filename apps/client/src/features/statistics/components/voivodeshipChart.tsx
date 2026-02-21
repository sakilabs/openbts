import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveOperatorMnc, getOperatorColor, getOperatorSortIndex } from "@/lib/operatorUtils";
import type { VoivodeshipUkeRow, VoivodeshipInternalRow } from "../api";

function useRegionBarData(rows: { operator: { name: string }; region: { name: string } }[] | undefined, valueKey: string) {
  return useMemo(() => {
    if (!rows?.length) return { chartData: [], operators: [] };

    const operatorSet = new Map<string, { name: string; color: string }>();
    const regionMap = new Map<string, Record<string, string | number>>();

    for (const row of rows) {
      if (!operatorSet.has(row.operator.name)) {
        const mnc = resolveOperatorMnc(null, row.operator.name);
        operatorSet.set(row.operator.name, {
          name: row.operator.name,
          color: mnc ? getOperatorColor(mnc) : "#94a3b8",
        });
      }

      const existing = regionMap.get(row.region.name) ?? { region: row.region.name };
      existing[row.operator.name] = (row as Record<string, unknown>)[valueKey] as number;
      regionMap.set(row.region.name, existing);
    }

    // Compute total per region and sort descending
    const chartData = [...regionMap.values()]
      .map((row) => {
        const total = Object.entries(row).reduce((sum, [k, v]) => (k !== "region" && typeof v === "number" ? sum + v : sum), 0);
        return { ...row, _total: total };
      })
      .sort((a, b) => (b._total as number) - (a._total as number));

    const operators = [...operatorSet.values()].sort(
      (a, b) => getOperatorSortIndex(resolveOperatorMnc(null, a.name)) - getOperatorSortIndex(resolveOperatorMnc(null, b.name)),
    );

    return { chartData, operators };
  }, [rows, valueKey]);
}

function VoivodeshipBarCard({
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
        <ChartContainer config={config} locale={locale} className="aspect-auto h-140 w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ top: 5, right: 60, left: 20, bottom: 5 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString(locale)} />
            <YAxis type="category" dataKey="region" tick={{ fontSize: 12 }} width={120} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {operators.map((op, i) => (
              <Bar key={op.name} dataKey={op.name} fill={op.color} stackId="stack" radius={i === operators.length - 1 ? [0, 4, 4, 0] : 0}>
                {i === operators.length - 1 && (
                  <LabelList
                    dataKey="_total"
                    position="right"
                    fontSize={11}
                    className="fill-foreground"
                    formatter={(v: number) => v.toLocaleString(locale)}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function VoivodeshipChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-140 w-full" />
      </CardContent>
    </Card>
  );
}

export function UkeVoivodeshipChart({ data, isLoading }: { data?: VoivodeshipUkeRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { chartData, operators } = useRegionBarData(data, "unique_stations");

  if (isLoading) return <VoivodeshipChartSkeleton />;
  return <VoivodeshipBarCard title={t("charts.byVoivodeship")} chartData={chartData} operators={operators} locale={i18n.language} />;
}

export function InternalVoivodeshipChart({ data, isLoading }: { data?: VoivodeshipInternalRow[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");
  const { chartData, operators } = useRegionBarData(data, "stations");

  if (isLoading) return <VoivodeshipChartSkeleton />;
  return <VoivodeshipBarCard title={t("charts.internalByVoivodeship")} chartData={chartData} operators={operators} locale={i18n.language} />;
}
