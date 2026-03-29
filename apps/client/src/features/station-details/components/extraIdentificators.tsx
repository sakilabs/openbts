import { useTranslation } from "react-i18next";
import type { ExtraIdentificator } from "@/types/station";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CopyButton } from "./copyButton";

type ExtraIdentificatorsDisplayProps = {
  data: ExtraIdentificator;
  operatorMnc?: number | null;
};

const MNO_BRAND: Record<number, string> = {
  26003: "OPL",
  26002: "TMPL",
  26001: "Plus",
  26006: "Play",
};

const MNO_LOGO: Record<string, string> = {
  OPL: "/operators/orange.svg",
  TMPL: "/operators/t-mobile.svg",
  Plus: "/operators/plus.svg",
  Play: "/operators/play.svg",
};

export function ExtraIdentificatorsDisplay({ data, operatorMnc }: ExtraIdentificatorsDisplayProps) {
  const { t } = useTranslation("common");
  const brand = (operatorMnc !== null && operatorMnc !== undefined ? MNO_BRAND[operatorMnc] : undefined) ?? "MNO";
  const mnoLabel = t("labels.mnoName", { brand });

  return (
    <>
      {data.networks_id && (
        <div className="flex items-center gap-2">
          <img src="/operators/networks.svg" alt="" className="size-4 shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("labels.networksId")}:</span>
          <span className="text-sm font-mono font-medium">{data.networks_id}</span>
          <CopyButton text={String(data.networks_id)} />
        </div>
      )}
      {data.networks_name && (
        <div className="flex items-center gap-2 min-w-0">
          <img src="/operators/networks.svg" alt="" className="size-4 shrink-0" />
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
          {MNO_LOGO[brand] ? <img src={MNO_LOGO[brand]} alt={brand} className="h-5 w-auto max-w-20 shrink-0 [image-rendering:crisp-edges]" /> : null}
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
