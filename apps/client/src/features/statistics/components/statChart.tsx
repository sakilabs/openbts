import { useReducedMotion } from "motion/react";
import { memo, useMemo } from "react";

import * as AreaChartImport from "@/components/evilcharts/charts/area-chart";
import * as BarChartImport from "@/components/evilcharts/charts/bar-chart";
import * as LineChartImport from "@/components/evilcharts/charts/line-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";

import type { ChartType } from "./chartTypeContext";

export interface Series {
  key: string;
  label: string;
  color: string;
}

interface StatChartProps {
  type: ChartType;
  data: Record<string, string | number>[];
  series: Series[];
  dataXKey: string;
  stacked?: boolean;
  className?: string;
  isLoading?: boolean;
  tooltipFormatter?: unknown;
  showBrush?: boolean;
}

function buildConfig(series: Series[]): ChartConfig {
  return Object.fromEntries(series.map((s) => [s.key, { label: s.label, colors: { light: [s.color], dark: [s.color] } }]));
}

export const StatChart = memo(function StatChart({
  type,
  data,
  series,
  dataXKey,
  stacked,
  className,
  isLoading,
  tooltipFormatter,
  showBrush = false,
}: StatChartProps) {
  const reduce = useReducedMotion() === true;
  const config = useMemo(() => buildConfig(series), [series]);
  const common = { data, config, isLoading, showBrush, className, animationType: reduce ? "none" : "left-to-right" } as const;

  if (type === "area") {
    const { EvilAreaChart, Area, Grid, XAxis, YAxis, Tooltip, Legend } = AreaChartImport;
    return (
      <EvilAreaChart {...common} stackType={stacked ? "stacked" : "default"} curveType="monotoneX">
        <Grid />
        <XAxis dataKey={dataXKey} />
        <YAxis />
        <Tooltip formatter={tooltipFormatter} />
        <Legend isClickable />
        {series.map((s) => (
          <Area key={s.key} dataKey={s.key} variant="gradient" isClickable />
        ))}
      </EvilAreaChart>
    );
  }
  if (type === "line") {
    const { EvilLineChart, Line, Grid, XAxis, YAxis, Tooltip, Legend } = LineChartImport;
    return (
      <EvilLineChart {...common}>
        <Grid />
        <XAxis dataKey={dataXKey} />
        <YAxis />
        <Tooltip formatter={tooltipFormatter} />
        <Legend isClickable />
        {series.map((s) => (
          <Line key={s.key} dataKey={s.key} isClickable />
        ))}
      </EvilLineChart>
    );
  }
  if (type === "bar") {
    const { EvilBarChart, Bar, Grid, XAxis, YAxis, Tooltip, Legend } = BarChartImport;
    return (
      <EvilBarChart {...common} stackType={stacked ? "stacked" : "default"}>
        <Grid />
        <XAxis dataKey={dataXKey} />
        <YAxis />
        <Tooltip formatter={tooltipFormatter} />
        <Legend isClickable />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} variant="gradient" isClickable />
        ))}
      </EvilBarChart>
    );
  }
});
