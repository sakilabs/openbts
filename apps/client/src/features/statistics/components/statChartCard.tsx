import { useTranslation } from "react-i18next";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useChartType } from "./chartTypeContext";
import type { Series } from "./statChart";
import { StatChart } from "./statChart";

interface Props {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  data: Record<string, string | number>[];
  series: Series[];
  dataXKey: string;
  stacked?: boolean;
  height?: string;
  showBrush?: boolean;
  isLoading?: boolean;
}

export function StatChartCard({ title, description, toolbar, data, series, dataXKey, stacked, height = "h-72", showBrush, isLoading }: Props) {
  const { t } = useTranslation("statistics");
  const { type } = useChartType();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        </div>
        {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      </CardHeader>
      <CardContent>
        {data.length === 0 && !isLoading ? (
          <div className={cn("flex items-center justify-center text-muted-foreground text-sm", height)}>{t("charts.noData")}</div>
        ) : (
          <StatChart
            type={type}
            data={data}
            series={series}
            stacked={stacked}
            className={height}
            showBrush={showBrush}
            isLoading={isLoading}
            dataXKey={dataXKey}
          />
        )}
      </CardContent>
    </Card>
  );
}
