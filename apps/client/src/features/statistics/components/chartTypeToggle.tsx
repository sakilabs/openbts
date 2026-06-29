import { ChartAverageIcon, ChartHistogramIcon, ChartLineData01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

import { useChartType, type ChartType } from "./chartTypeContext";

const TYPES: { key: ChartType; icon: typeof ChartAverageIcon }[] = [
  { key: "area", icon: ChartAverageIcon },
  { key: "line", icon: ChartLineData01Icon },
  { key: "bar", icon: ChartHistogramIcon },
];

export function ChartTypeToggle() {
  const { t } = useTranslation("statistics");
  const { type, setType } = useChartType();
  return (
    <ButtonGroup aria-label={t("chartType.label")}>
      {TYPES.map(({ key, icon }) => (
        <Button
          key={key}
          type="button"
          size="icon"
          variant={type === key ? "secondary" : "ghost"}
          aria-pressed={type === key}
          aria-label={t(`chartType.${key}`)}
          title={t(`chartType.${key}`)}
          className={cn(type === key && "ring-1 ring-primary/40")}
          onClick={() => setType(key)}
        >
          <HugeiconsIcon icon={icon} className="size-4" />
        </Button>
      ))}
    </ButtonGroup>
  );
}
