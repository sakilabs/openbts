import { memo } from "react";
import { useTranslation } from "react-i18next";
import { getOperatorColor, normalizeOperatorName, resolveOperatorMnc } from "@/lib/operatorUtils";
import { isPermitExpired } from "@/lib/dateUtils";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";
import { calculateDistance, formatDistance, formatFrequency } from "../utils";
import type { RadioLine } from "@/types/station";

type RadioLinePopupContentProps = {
	radioLines: RadioLine[];
	coordinates: [number, number];
	onOpenDetails: (radioLine: RadioLine) => void;
};

function RadioLineEntry({ radioLine, onOpenDetails }: { radioLine: RadioLine; onOpenDetails: (rl: RadioLine) => void }) {
	const { t } = useTranslation(["main", "common"]);

	const operatorName = radioLine.operator?.name ?? t("unknownOperator");
	const mnc = resolveOperatorMnc(radioLine.operator?.mnc, radioLine.operator?.name);
	const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
	const isExpired = radioLine.permit.expiry_date ? isPermitExpired(radioLine.permit.expiry_date) : false;
	const distance = calculateDistance(radioLine.tx.latitude, radioLine.tx.longitude, radioLine.rx.latitude, radioLine.rx.longitude);
	const freqFormatted = formatFrequency(radioLine.link.freq);

	return (
		<button type="button" className="w-full text-left px-3 py-2 hover:bg-muted/50 cursor-pointer" onClick={() => onOpenDetails(radioLine)}>
			<div className="flex items-center gap-1.5">
				<div className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
				<span className="font-medium text-xs" style={{ color }}>
					{normalizeOperatorName(operatorName)}
				</span>
				<span className="text-[10px] text-muted-foreground font-mono">#{radioLine.id}</span>
			</div>
			<div className="flex flex-wrap gap-1 mt-1 pl-3.5">
				<span className="px-1 py-px rounded-md bg-muted text-[8px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50">
					{freqFormatted}
				</span>
				{radioLine.link.ch_width && (
					<span className="px-1 py-px rounded-md bg-muted text-[8px] font-mono font-medium text-muted-foreground border border-border/50">
						{radioLine.link.ch_width} MHz
					</span>
				)}
				{radioLine.link.polarization && (
					<span className="px-1 py-px rounded-md bg-muted text-[8px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50">
						{radioLine.link.polarization}
					</span>
				)}
				<span className="px-1 py-px rounded-md bg-muted text-[8px] font-mono font-medium text-muted-foreground border border-border/50">
					{formatDistance(distance)}
				</span>
				{isExpired && (
					<span className="px-1 py-px rounded-md bg-destructive/10 text-[8px] font-semibold uppercase tracking-wider text-destructive border border-destructive/20">
						{t("common:status.expired")}
					</span>
				)}
			</div>
		</button>
	);
}

export const RadioLinePopupContent = memo(function RadioLinePopupContent({ radioLines, coordinates, onOpenDetails }: RadioLinePopupContentProps) {
	const { t } = useTranslation(["main", "common"]);
	const { preferences } = usePreferences();

	const title =
		radioLines.length === 1
			? t("radiolines.title", { id: radioLines[0].id })
			: `${radioLines.length} ${t("overlay.radiolinesCount", { count: radioLines.length })}`;

	return (
		<div className="w-72 text-sm">
			<div className="px-3 py-2 border-b border-border/50">
				<h3 className="font-medium text-sm leading-tight pr-4">{title}</h3>
			</div>

			<div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-border/30">
				{radioLines.map((rl) => (
					<RadioLineEntry key={rl.id} radioLine={rl} onOpenDetails={onOpenDetails} />
				))}
			</div>

			<div className="px-3 py-1.5 border-t border-border/50 flex items-center justify-between">
				<span className="text-[10px] text-muted-foreground font-mono">
					GPS: {formatCoordinates(coordinates[1], coordinates[0], preferences.gpsFormat)}
				</span>
			</div>
		</div>
	);
});
