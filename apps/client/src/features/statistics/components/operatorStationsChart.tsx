import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveOperatorMnc, getOperatorColor, getOperatorSortIndex } from "@/lib/operatorUtils";
import type { StatsSummary } from "../api";

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

export function InternalOperatorStationsChart({ data, isLoading }: { data?: StatsSummary; isLoading: boolean }) {
  const { t, i18n } = useTranslation("statistics");

  const operatorStationsData = useMemo(
    () =>
      (data?.internal.by_operator ?? [])
        .map((r) => {
          const mnc = resolveOperatorMnc(null, r.operator.name);
          return { name: r.operator.name, value: r.stations, fill: mnc ? getOperatorColor(mnc) : "#94a3b8", mnc };
        })
        .sort((a, b) => getOperatorSortIndex(a.mnc) - getOperatorSortIndex(b.mnc)),
    [data],
  );

  if (isLoading) {
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

  if (!data) return null;

  return <DonutChart title={t("charts.internalStationsPerOperator")} data={operatorStationsData} locale={i18n.language} />;
}
