import type { Cell } from "@/types/station";
import { FlashIcon, SignalFull02Icon, SmartPhone01Icon, Wifi01Icon, RadioIcon, AirdropIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export function groupCellsByRat(cells: Cell[]): Record<string, Cell[]> {
	return cells.reduce<Record<string, Cell[]>>((groups, cell) => {
		groups[cell.rat] ??= [];
		groups[cell.rat].push(cell);
		return groups;
	}, {});
}

export const RAT_ICONS: Record<string, IconSvgElement> = {
	GSM: SignalFull02Icon,
	UMTS: Wifi01Icon,
	LTE: SmartPhone01Icon,
	NR: FlashIcon,
	CDMA: RadioIcon,
	IOT: AirdropIcon,
	OTHER: SignalFull02Icon,
};
