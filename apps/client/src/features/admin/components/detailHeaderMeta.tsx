import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatFullDate, formatRelativeTime } from "@/lib/format";

type DetailHeaderMetaItemProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function DetailHeaderMetaItem({ label, value, className }: DetailHeaderMetaItemProps) {
  return (
    <div className={className}>
      <div className="text-[10px] leading-3 font-medium text-muted-foreground">{label}</div>
      <div className="text-xs leading-4 font-medium text-foreground tabular-nums truncate">{value}</div>
    </div>
  );
}

type DetailHeaderTimestampProps = {
  label: string;
  value?: string | null;
  locale: string;
};

export function DetailHeaderTimestamp({ label, value, locale }: DetailHeaderTimestampProps) {
  const { t } = useTranslation("common");

  return (
    <DetailHeaderMetaItem
      label={label}
      value={
        value ? (
          <Tooltip>
            <TooltipTrigger className="cursor-default truncate">{formatRelativeTime(value, t)}</TooltipTrigger>
            <TooltipContent>{formatFullDate(value, locale)}</TooltipContent>
          </Tooltip>
        ) : (
          "-"
        )
      }
    />
  );
}
