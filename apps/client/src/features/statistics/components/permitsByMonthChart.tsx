import { AirportTowerIcon, Calendar03Icon, FileAttachmentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LabelList, Rectangle } from "recharts";

import * as BarChartImport from "@/components/evilcharts/charts/bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { PermitSnapshot } from "../api";
import { compareBandNames } from "../lib/bandOrder";
import { operatorColor, operatorDataKey, operatorSeries } from "../lib/series";
import { permitSnapshotQueryOptions } from "../queries";

type SnapshotMetric = "permits" | "stations";
type SnapshotChartDatum = { operator: string; all: number; delta: number; deltaLabel: string; color: string };
type SnapshotBarShapeProps = ComponentProps<typeof Rectangle> & {
  dataKey?: string;
  index?: number;
  payload?: Partial<SnapshotChartDatum>;
};

const SNAPSHOT_BAR_SIZE = 32;
const SNAPSHOT_GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] divide-x divide-y divide-border border-t border-border";

const SNAPSHOT_METRICS: { key: SnapshotMetric; icon: typeof FileAttachmentIcon }[] = [
  { key: "stations", icon: AirportTowerIcon },
  { key: "permits", icon: FileAttachmentIcon },
];

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthValueToDate(value: string): Date {
  return new Date(`${value}-01T00:00:00.000Z`);
}

function dateToMonthValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function MonthPickerButton({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const { t, i18n } = useTranslation("statistics");
  const date = monthValueToDate(value);
  const label = date.toLocaleDateString(i18n.language, { month: "long", timeZone: "UTC", year: "numeric" });

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "h-8 rounded-lg border bg-transparent px-2.5 text-sm transition-colors flex items-center gap-2 min-w-36",
          "border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-muted",
        )}
        aria-label={t("permitsByMonth.month")}
      >
        <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-muted-foreground shrink-0" />
        <span className="truncate capitalize">{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <DatePickerInput value={date} onChange={(nextDate) => onValueChange(nextDate !== null ? dateToMonthValue(nextDate) : currentMonth())} />
      </PopoverContent>
    </Popover>
  );
}

function useSnapshotComparison(rows: PermitSnapshot["rows"] | undefined) {
  return useMemo(() => {
    const bands = new Map<string, { id: number; name: string; rat: string; rows: PermitSnapshot["rows"] }>();
    const operatorOrder = new Map(operatorSeries((rows ?? []).map((row) => row.operator)).map((series, index) => [series.key, index]));

    for (const row of rows ?? []) {
      const existing = bands.get(row.band.name) ?? { id: row.band.id, name: row.band.name, rat: row.band.rat, rows: [] };
      existing.rows.push(row);
      bands.set(row.band.name, existing);
    }

    return [...bands.values()]
      .map((band) => ({
        ...band,
        rows: [...band.rows].sort(
          (a, b) =>
            (operatorOrder.get(operatorDataKey(a.operator)) ?? Number.MAX_SAFE_INTEGER) -
              (operatorOrder.get(operatorDataKey(b.operator)) ?? Number.MAX_SAFE_INTEGER) || a.operator.name.localeCompare(b.operator.name),
        ),
      }))
      .sort((a, b) => compareBandNames(a.name, b.name));
  }, [rows]);
}

function SnapshotMetricToggle({ value, onValueChange }: { value: SnapshotMetric; onValueChange: (metric: SnapshotMetric) => void }) {
  const { t } = useTranslation("statistics");
  return (
    <ButtonGroup aria-label={t("permitsByMonth.view")}>
      {SNAPSHOT_METRICS.map(({ key, icon }) => (
        <Button
          key={key}
          type="button"
          size="sm"
          variant={value === key ? "default" : "outline"}
          aria-pressed={value === key}
          aria-label={t(`permitsByMonth.views.${key}`)}
          title={t(`permitsByMonth.views.${key}`)}
          onClick={() => onValueChange(key)}
        >
          <HugeiconsIcon icon={icon} className="size-4" />
          <span className="hidden text-xs sm:inline">{t(`permitsByMonth.views.${key}`)}</span>
        </Button>
      ))}
    </ButtonGroup>
  );
}

function SnapshotComparisonGrid({
  rows,
  isLoading,
  metric,
}: {
  rows: PermitSnapshot["rows"] | undefined;
  isLoading: boolean;
  metric: SnapshotMetric;
}) {
  const { t } = useTranslation("statistics");
  const bands = useSnapshotComparison(rows);

  if (isLoading) {
    return (
      <div className={SNAPSHOT_GRID_CLASS}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="p-4">
            <div className="mb-3 h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-56 animate-pulse rounded bg-muted/40" />
          </div>
        ))}
      </div>
    );
  }

  if (bands.length === 0) {
    return <div className="flex h-56 items-center justify-center border-t border-border text-muted-foreground text-sm">{t("charts.noData")}</div>;
  }

  return (
    <div className={SNAPSHOT_GRID_CLASS}>
      {bands.map((band) => (
        <SnapshotComparisonCard key={band.id} band={band} metric={metric} />
      ))}
    </div>
  );
}

function formatWholeNumber(value: unknown, locale: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString(locale) : String(value);
}

function formatSignedDelta(value: number, locale: string): string {
  const formatted = Math.abs(value).toLocaleString(locale);
  if (value < 0) return `-${formatted}`;
  return formatted;
}

function formatPercent(value: number, locale: string): string {
  const maximumFractionDigits = value < 0.1 ? 3 : value < 1 ? 2 : 1;
  return `${value.toLocaleString(locale, { maximumFractionDigits })}%`;
}

function getMetricValues(row: PermitSnapshot["rows"][number], metric: SnapshotMetric, locale: string) {
  const all = metric === "permits" ? row.permits : row.unique_stations;
  const delta = metric === "permits" ? row.permits_delta : row.unique_stations_delta;
  const absDelta = Math.abs(delta);
  const deltaTone = delta < 0 ? "negative" : "positive";
  const deltaLabel =
    absDelta > 0 && all > 0 ? `${formatSignedDelta(delta, locale)}|${formatPercent((absDelta / all) * 100, locale)}|${deltaTone}` : "";
  return { all, delta, deltaLabel };
}

function createSnapshotBarShape(patternPrefix: string, variant: "solid" | "hatched") {
  return function SnapshotBarShape(props: unknown) {
    const shapeProps = props as unknown as SnapshotBarShapeProps;
    const fill = shapeProps.payload?.color ?? "var(--chart-1)";

    if (variant === "solid") return <Rectangle {...shapeProps} fill={fill} />;

    const index = typeof shapeProps.index === "number" ? shapeProps.index : 0;
    const dataKey = shapeProps.dataKey ?? "bar";
    const patternId = `${patternPrefix}-${dataKey}-${index}`;

    return (
      <g>
        <defs>
          <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={fill} opacity={0.16} />
            <path d="M 0 0 L 0 6" stroke={fill} strokeWidth={2} />
          </pattern>
        </defs>
        <Rectangle {...shapeProps} fill={`url(#${patternId})`} stroke={fill} strokeWidth={1} />
      </g>
    );
  };
}

function NewBarLabel({
  x,
  y,
  height,
  width,
  value,
  viewBox,
}: {
  x?: number | string;
  y?: number | string;
  height?: number | string;
  width?: number | string;
  value?: unknown;
  viewBox?: { x?: number | string; y?: number | string; height?: number | string; width?: number | string };
}) {
  const [amountLabel, percentLabel, deltaTone] = typeof value === "string" ? value.split("|") : [];
  const xValue = Number(viewBox?.x ?? x);
  const yValue = Number(viewBox?.y ?? y);
  const heightValue = Number(viewBox?.height ?? height);
  const widthValue = Number(viewBox?.width ?? width);
  if (!amountLabel || !percentLabel || !Number.isFinite(xValue) || !Number.isFinite(yValue) || !Number.isFinite(widthValue)) return null;

  const labelLift = Number.isFinite(heightValue) && heightValue < 3 ? 22 : 18;
  const labelY = Math.max(12, yValue - labelLift);
  const labelClassName = deltaTone === "negative" ? "fill-red-500" : "fill-emerald-500";
  return (
    <text x={xValue + widthValue / 2} y={labelY} textAnchor="middle" className={`text-[10px] ${labelClassName}`}>
      <tspan x={xValue + widthValue / 2} dy={0}>
        {amountLabel}
      </tspan>
      <tspan x={xValue + widthValue / 2} dy={11}>
        {percentLabel}
      </tspan>
    </text>
  );
}

const SnapshotComparisonCard = memo(function SnapshotComparisonCard({
  band,
  metric,
}: {
  band: { id: number; name: string; rows: PermitSnapshot["rows"] };
  metric: SnapshotMetric;
}) {
  const { t, i18n } = useTranslation("statistics");
  const { EvilBarChart, Bar, XAxis, YAxis, Grid, Tooltip } = BarChartImport;
  const valueFormatter = useMemo(
    () =>
      (value: number, dataKey: string, payload: Record<string, unknown>): React.ReactNode => {
        if (dataKey === "delta") {
          const delta = payload["delta"];
          const displayValue = typeof delta === "number" ? delta : value;
          if (displayValue === 0) return formatSignedDelta(displayValue, i18n.language);

          const toneClassName = displayValue < 0 ? "text-red-500" : "text-emerald-500";
          return <span className={toneClassName}>{formatSignedDelta(displayValue, i18n.language)}</span>;
        }

        return value.toLocaleString(i18n.language);
      },
    [i18n.language],
  );

  const { data, config } = useMemo(() => {
    const rows = band.rows;
    const chartData: SnapshotChartDatum[] = rows.map((row) => ({
      operator: row.operator.name,
      color: operatorColor(row.operator),
      ...getMetricValues(row, metric, i18n.language),
    }));
    const cfg = {
      all: { label: t("permitsByMonth.all"), colors: { light: ["var(--chart-1)"], dark: ["var(--chart-1)"] } },
      delta: { label: t("permitsByMonth.new"), colors: { light: ["var(--chart-2)"], dark: ["var(--chart-2)"] } },
    } satisfies Record<"all" | "delta", ChartConfig[string]>;
    return { data: chartData, config: cfg };
  }, [band.rows, i18n.language, metric, t]);
  const chartMinWidth = Math.max(320, data.length * (SNAPSHOT_BAR_SIZE * 2 + 12) + 72);
  const allBarShape = useMemo(() => createSnapshotBarShape(`snapshot-${band.id}-all`, "solid"), [band.id]);
  const deltaBarShape = useMemo(() => createSnapshotBarShape(`snapshot-${band.id}-delta`, "hatched"), [band.id]);

  return (
    <div className="p-4 [contain-intrinsic-size:360px] [content-visibility:auto]">
      <h3 className="mb-3 text-sm font-medium">{band.name}</h3>
      <div className="scrollbar-hide overflow-x-auto overflow-y-hidden [scrollbar-gutter:stable]">
        <div style={{ minWidth: chartMinWidth }}>
          <EvilBarChart
            config={config}
            data={data}
            className="h-56"
            xDataKey="operator"
            barCategoryGap={30}
            barGap={3}
            chartProps={{ margin: { top: 20, left: 8, right: 8 } }}
          >
            <Grid />
            <XAxis dataKey="operator" />
            <YAxis width={54} locale={i18n.language} />
            <Tooltip valueFormatter={valueFormatter} />
            <Bar
              dataKey="all"
              barProps={{
                barSize: SNAPSHOT_BAR_SIZE,
                maxBarSize: 40,
                shape: allBarShape,
                activeBar: allBarShape,
                children: [
                  <LabelList
                    key="lbl"
                    dataKey="all"
                    position="top"
                    formatter={(value) => formatWholeNumber(value, i18n.language)}
                    style={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />,
                ],
              }}
            />
            <Bar
              dataKey="delta"
              variant="hatched"
              barProps={{
                barSize: SNAPSHOT_BAR_SIZE,
                maxBarSize: 40,
                minPointSize: (value) => (typeof value === "number" && value !== 0 ? 3 : 0),
                shape: deltaBarShape,
                activeBar: deltaBarShape,
                children: [<LabelList key="lbl" dataKey="deltaLabel" content={<NewBarLabel />} />],
              }}
            />
          </EvilBarChart>
        </div>
      </div>
    </div>
  );
});

export function PermitsByMonthChart() {
  const { t } = useTranslation("statistics");
  const [month, setMonth] = useState(currentMonth);
  const [metric, setMetric] = useState<SnapshotMetric>("stations");
  const { data, isLoading } = useQuery(permitSnapshotQueryOptions(month));

  const description = data?.snapshot_date
    ? t("permitsByMonth.snapshotDate", {
        date: data.snapshot_date.slice(0, 10),
        previousDate: data.previous_snapshot_date?.slice(0, 10) ?? t("permitsByMonth.noPreviousSnapshot"),
      })
    : t("permitsByMonth.description");

  return (
    <div className="relative border border-border">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-medium leading-none">{t("permitsByMonth.title")}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <SnapshotMetricToggle value={metric} onValueChange={setMetric} />
          <MonthPickerButton value={month} onValueChange={setMonth} />
        </div>
      </div>
      <SnapshotComparisonGrid rows={data?.rows} isLoading={isLoading} metric={metric} />
    </div>
  );
}
