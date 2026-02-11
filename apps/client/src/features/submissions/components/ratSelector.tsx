import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { SignalFull02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { RAT_OPTIONS } from "@/features/shared/rat";
import type { RatType } from "../types";

type RatSelectorProps = {
	selectedRats: RatType[];
	onRatsChange: (rats: RatType[]) => void;
};

export function RatSelector({ selectedRats, onRatsChange }: RatSelectorProps) {
	const { t } = useTranslation("submissions");

	const handleToggleRat = (rat: RatType) => {
		if (selectedRats.includes(rat)) {
			onRatsChange(selectedRats.filter((r) => r !== rat));
		} else {
			onRatsChange([...selectedRats, rat]);
		}
	};

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
				<HugeiconsIcon icon={SignalFull02Icon} className="size-4 text-primary" />
				<span className="font-semibold text-sm">{t("ratSelector.title")}</span>
			</div>

			<div className="p-4">
				<p className="text-xs text-muted-foreground mb-3">{t("ratSelector.description")}</p>
				<div className="flex flex-wrap gap-1">
					{RAT_OPTIONS.map((rat) => {
						const isSelected = selectedRats.includes(rat.value);
						return (
							<button
								key={rat.value}
								type="button"
								onClick={() => handleToggleRat(rat.value)}
								className={cn(
									"flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border",
									isSelected
										? "bg-primary text-primary-foreground border-primary shadow-sm"
										: "border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input",
								)}
							>
								<span className="text-xs opacity-70">{rat.gen}</span>
								<span>{rat.label}</span>
							</button>
						);
					})}
				</div>
				<p className="text-xs text-muted-foreground mt-3">{t("ratSelector.iotHint")}</p>
			</div>
		</div>
	);
}
