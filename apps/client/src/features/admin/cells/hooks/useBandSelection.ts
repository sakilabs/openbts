import { useMemo, useCallback } from "react";
import type { Band } from "@/types/station";

export function useBandSelection(bands: Band[], rat: string, bandId: number) {
	const bandsForRat = useMemo(() => bands.filter((b) => b.rat === rat), [bands, rat]);
	const uniqueBandValues = useMemo(() => [...new Set(bandsForRat.map((b) => b.value))].sort((a, b) => a - b), [bandsForRat]);

	const currentBand = useMemo(() => bandsForRat.find((b) => b.id === bandId), [bandsForRat, bandId]);
	const bandValue = currentBand?.value ?? null;
	const duplex = currentBand?.duplex ?? null;

	const duplexOptions = useMemo(() => {
		if (!bandValue) return [];
		return [...new Set(bandsForRat.filter((b) => b.value === bandValue).map((b) => b.duplex))];
	}, [bandsForRat, bandValue]);

	const hasDuplexChoice = duplexOptions.length > 1 || (duplexOptions.length === 1 && duplexOptions[0] !== null);

	const findBandId = useCallback(
		(value: number | null, dup: string | null): number | null => {
			if (!value) return null;
			return bandsForRat.find((b) => b.value === value && b.duplex === dup)?.id ?? bandsForRat.find((b) => b.value === value)?.id ?? null;
		},
		[bandsForRat],
	);

	return { bandsForRat, uniqueBandValues, currentBand, bandValue, duplex, duplexOptions, hasDuplexChoice, findBandId };
}
