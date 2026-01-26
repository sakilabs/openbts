import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NetWorkS } from "@/types/station";

type NetworkIdentifiersProps = {
	networks: NetWorkS;
};

export function NetWorkSIds({ networks }: NetworkIdentifiersProps) {
	const { t } = useTranslation("stationDetails");

	return (
		<section>
			<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("specs.networkIdentifiers")}</h3>
			<div className="flex flex-wrap gap-x-8 gap-y-2.5 p-4 border rounded-xl bg-muted/20">
				{networks.networks_id && (
					<Tooltip>
						<TooltipTrigger>
							<div className="flex items-center gap-2 cursor-help">
								<HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
								<span className="text-sm text-muted-foreground">N! ID:</span>
								<span className="text-sm font-mono font-medium">{networks.networks_id}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{t("specs.networkIdTooltip")}</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</section>
	);
}
