import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  stationCount: number;
  cellCount: number;
  hasConflicts: boolean;
  hasUnresolvedBands: boolean;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function BatchReviewFooter({ stationCount, cellCount, hasConflicts, hasUnresolvedBands, isPending, onCancel, onSubmit }: Props) {
  const { t } = useTranslation(["submissions", "common"]);
  const isBlocked = hasConflicts || hasUnresolvedBands;

  return (
    <div className="sticky bottom-0 border-t border-border bg-background px-6 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("batch.stationCellSummary", { stations: stationCount, cells: cellCount })}</p>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            {t("common:actions.cancel")}
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={isBlocked || isPending} className="min-w-28">
            {isPending ? <Spinner className="w-3.5 h-3.5" /> : t("batch.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
