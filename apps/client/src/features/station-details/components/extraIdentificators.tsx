import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon, WifiConnected01Icon, Note02Icon } from "@hugeicons/core-free-icons";
import type { ExtraIdentificator } from "@/types/station";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ExtraIdentificatorsDisplayProps = {
  data: ExtraIdentificator;
};

export function ExtraIdentificatorsDisplay({ data }: ExtraIdentificatorsDisplayProps) {
  const { t } = useTranslation("common");

  return (
    <>
      {data.networks_id && (
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("labels.networksId")}:</span>
          <span className="text-sm font-mono font-medium">{data.networks_id}</span>
        </div>
      )}
      {data.networks_name && (
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={WifiConnected01Icon} className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{t("labels.networksName")}:</span>
          <Tooltip>
            <TooltipTrigger render={<span className="text-sm font-medium truncate min-w-0" />}>{data.networks_name}</TooltipTrigger>
            <TooltipContent>{data.networks_name}</TooltipContent>
          </Tooltip>
        </div>
      )}
      {data.mno_name && (
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={Note02Icon} className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{t("labels.mnoName")}:</span>
          <Tooltip>
            <TooltipTrigger render={<span className="text-sm font-medium truncate min-w-0" />}>{data.mno_name}</TooltipTrigger>
            <TooltipContent>{data.mno_name}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  );
}
