import { useTranslation } from "react-i18next";
import type { FilterKeyword } from "../../types";

type AutocompleteDropdownProps = {
	options: FilterKeyword[];
	onSelect: (keyword: string) => void;
};

export function AutocompleteDropdown({ options, onSelect }: AutocompleteDropdownProps) {
	const { t } = useTranslation("map");

	if (options.length === 0) return null;

	return (
		<div className="border-t bg-background animate-in fade-in slide-in-from-top-1 duration-150 max-h-64 overflow-y-auto custom-scrollbar">
			<div className="px-2 py-2">
				<p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("autocomplete.availableFilters")}</p>
				<div className="space-y-0.5">
					{options.map((option) => (
						<button
							type="button"
							key={option.key}
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => onSelect(option.key)}
							className="w-full flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer"
						>
							<span className="font-mono text-sm text-primary font-medium shrink-0 mt-0.5">{option.key}</span>
							<span className="text-xs text-muted-foreground leading-relaxed">{option.description}</span>
						</button>
					))}
				</div>
				<div className="mt-2 px-3 py-2 bg-muted/30 rounded-lg">
					<p className="text-[10px] text-muted-foreground">
						<span className="font-semibold">{t("autocomplete.tip")}</span> {t("autocomplete.tipText")}
						<br />
						{t("autocomplete.example")} <span className="font-mono text-foreground">band: 800,1800,2100</span>
					</p>
				</div>
			</div>
		</div>
	);
}
