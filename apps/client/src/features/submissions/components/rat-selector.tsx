import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { SignalFull02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import type { RatType } from "../types";

const RAT_OPTIONS: { value: RatType; label: string; gen: string }[] = [
	{ value: "GSM", label: "GSM", gen: "2G" },
	{ value: "UMTS", label: "UMTS", gen: "3G" },
	{ value: "LTE", label: "LTE", gen: "4G" },
	{ value: "NR", label: "NR", gen: "5G" },
];

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
				<div className="flex flex-wrap gap-2">
					{RAT_OPTIONS.map((rat) => {
						const isSelected = selectedRats.includes(rat.value);
						return (
							<button
								key={rat.value}
								type="button"
								onClick={() => handleToggleRat(rat.value)}
								className={cn(
									"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
									isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 hover:bg-muted border-transparent text-foreground",
								)}
							>
								<span
									className={cn(
										"text-[10px] px-1 py-0.5 rounded font-bold",
										isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground",
									)}
								>
									{rat.gen}
								</span>
								<span>{rat.label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
