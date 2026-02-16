import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon, WifiConnected01Icon, Note02Icon } from "@hugeicons/core-free-icons";
import type { NetWorkS } from "@/types/station";

type NetworkIdentifiersProps = {
  networks: NetWorkS;
};

export function NetWorkSIds({ networks }: NetworkIdentifiersProps) {
  const { t } = useTranslation("stationDetails");

  return (
    <>
      {networks.networks_id && (
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">N! ID:</span>
          <span className="text-sm font-mono font-medium">{networks.networks_id}</span>
        </div>
      )}
      {networks.networks_name && (
        <div className="flex items-start gap-2">
          <HugeiconsIcon icon={WifiConnected01Icon} className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("specs.networkName")}</span>
          <span className="text-sm font-medium wrap-break-word min-w-0">{networks.networks_name}</span>
        </div>
      )}
      {networks.mno_name && (
        <div className="flex items-start gap-2">
          <HugeiconsIcon icon={Note02Icon} className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t("specs.mnoName")}</span>
          <span className="text-sm font-medium wrap-break-word min-w-0">{networks.mno_name}</span>
        </div>
      )}
    </>
  );
}
