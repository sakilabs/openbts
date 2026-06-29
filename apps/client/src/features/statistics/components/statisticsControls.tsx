import { AnalyticsUpIcon } from "@hugeicons/core-free-icons";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { FLOATING_NAV_ACTION_TARGET_ID } from "@/components/layout/floating-nav";
import { MobileFilterChip, MobileFilterPanelTitle } from "@/components/ui/mobile-filter-chip";
import { useNavActionTarget } from "@/contexts/navActions";
import { cn } from "@/lib/utils";

import { useChartType, type ChartType } from "./chartTypeContext";
import { ChartTypeToggle } from "./chartTypeToggle";

const TYPES: ChartType[] = ["area", "line", "bar"];

export function StatisticsControls() {
  const target = useNavActionTarget();
  if (!target) return null;
  const isFloating = target.id === FLOATING_NAV_ACTION_TARGET_ID;

  return createPortal(
    <div className={cn("flex items-center gap-2", isFloating && "max-md:w-[calc(100vw-1.5rem)] max-md:min-w-0 max-md:gap-1")}>
      <div className="md:hidden">
        <ChartTypeChip />
      </div>
      <div className="hidden md:block">
        <ChartTypeToggle />
      </div>
    </div>,
    target,
  );
}

function ChartTypeChip() {
  const { t } = useTranslation("statistics");
  const { type, setType } = useChartType();
  return (
    <MobileFilterChip active={false} icon={AnalyticsUpIcon} label={t(`chartType.${type}`)}>
      <MobileFilterPanelTitle>{t(`chartType.${type}`)}</MobileFilterPanelTitle>
      <div className="grid gap-1">
        {TYPES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              "flex h-8 items-center rounded-md px-2 text-left text-sm transition-colors",
              type === key ? "bg-primary/10 text-primary" : "hover:bg-muted",
            )}
          >
            {t(`chartType.${key}`)}
          </button>
        ))}
      </div>
    </MobileFilterChip>
  );
  s;
}
