import { memo } from "react";

export type RadioLineTooltipContentProps = {
	color: string;
	freqFormatted: string;
	operatorName: string;
	distanceFormatted: string;
};

export const RadioLineTooltipContent = memo(function RadioLineTooltipContent({
	color,
	freqFormatted,
	operatorName,
	distanceFormatted,
}: RadioLineTooltipContentProps) {
	const parts = [freqFormatted, operatorName, distanceFormatted].filter(Boolean);
	const text = parts.join(" · ");

	return (
		<div className="flex items-center gap-1.5 px-2 py-1">
			<span
				className="size-2 shrink-0 rounded-full"
				style={{ backgroundColor: color }}
				aria-hidden
			/>
			<span className="text-xs font-medium whitespace-nowrap">{text}</span>
		</div>
	);
});
