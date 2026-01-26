import type { Cell } from "@/types/station";

const RAT_ORDER = ["GSM", "UMTS", "LTE", "NR"] as const;

export function getStationTechs(cells: Cell[]): string[] {
	const techs = [...new Set(cells.map((c) => c.rat))];

	return techs.sort((a, b) => {
		const indexA = RAT_ORDER.indexOf(a as (typeof RAT_ORDER)[number]);
		const indexB = RAT_ORDER.indexOf(b as (typeof RAT_ORDER)[number]);
		return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
	});
}
