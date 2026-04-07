import { useTranslation } from "react-i18next";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getMnoBrand } from "@/lib/operatorUtils";
import type { ExtraIdentificator } from "@/types/station";

import { CopyButton } from "./copyButton";
import NetworksIcon from "./logos/networks.svg?react";
import OrangeIcon from "./logos/orange.svg?react";
import PlayIcon from "./logos/play.svg?react";
import PlusIcon from "./logos/plus.svg?react";
import TmobileIcon from "./logos/t-mobile.svg?react";

type ExtraIdentificatorsDisplayProps = {
  data: ExtraIdentificator;
  operatorMnc?: number | null;
};

const MNO_LOGO: Partial<Record<string, typeof OrangeIcon>> = {
  OPL: OrangeIcon,
  TMPL: TmobileIcon,
  Plus: PlusIcon,
  Play: PlayIcon,
};

export function ExtraIdentificatorsDisplay({ data, operatorMnc }: ExtraIdentificatorsDisplayProps) {
  const { t } = useTranslation("common");
  const brand = getMnoBrand(operatorMnc);
  const mnoLabel = t("labels.mnoName", { brand });
  const MNOLogo = MNO_LOGO[brand];

  return (
    <>
      {data.networks_id !== null ? (
        <div className="flex items-center gap-2">
          <NetworksIcon className="size-4 shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("labels.networksId")}:</span>
          <span className="text-sm font-mono font-medium">{data.networks_id}</span>
          <CopyButton text={String(data.networks_id)} />
        </div>
      ) : null}
      {data.networks_name && (
        <div className="flex items-center gap-2 min-w-0">
          <NetworksIcon className="size-4 shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{t("labels.networksName")}:</span>
          <Tooltip>
            <TooltipTrigger render={<span className="text-sm font-medium truncate min-w-0" />}>{data.networks_name}</TooltipTrigger>
            <TooltipContent>{data.networks_name}</TooltipContent>
          </Tooltip>
          <CopyButton text={data.networks_name} />
        </div>
      )}
      {data.mno_name && (
        <div className="flex items-center gap-2 min-w-0">
          {MNOLogo ? <MNOLogo className="h-5 w-auto max-w-20 shrink-0" /> : null}
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{mnoLabel}:</span>
          <Tooltip>
            <TooltipTrigger render={<span className="text-sm font-medium truncate min-w-0" />}>{data.mno_name}</TooltipTrigger>
            <TooltipContent>{data.mno_name}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  );
}
