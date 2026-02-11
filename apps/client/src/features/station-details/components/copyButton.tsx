import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function CopyButton({ text }: { text: string }) {
	const { t } = useTranslation(["stationDetails", "common"]);
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Tooltip>
			<TooltipTrigger onClick={handleCopy} className="p-1 hover:bg-muted rounded transition-colors cursor-pointer">
				{copied ? (
					<HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-emerald-500" />
				) : (
					<HugeiconsIcon icon={Copy01Icon} className="size-3.5 text-muted-foreground" />
				)}
			</TooltipTrigger>
			<TooltipContent>{copied ? t("common:actions.copied") : t("common:actions.copy")}</TooltipContent>
		</Tooltip>
	);
}
