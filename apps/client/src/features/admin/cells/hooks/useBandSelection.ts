import { useCallback, useMemo } from "react";

import type { Band } from "@/types/station";

export function useBandSelection(bands: Band[], rat: string, bandId: number) {
  const bandsForRat = useMemo(() => bands.filter((b) => b.rat === rat), [bands, rat]);
  const uniqueBandValues = useMemo(() => [...new Set(bandsForRat.map((b) => b.value))].sort((a, b) => a - b), [bandsForRat]);

  const currentBand = useMemo(() => bandsForRat.find((b) => b.id === bandId), [bandsForRat, bandId]);
  const bandValue = currentBand?.value ?? null;
  const duplex = currentBand?.duplex ?? null;

  const duplexOptions = useMemo(() => {
    if (bandValue === null) return [];
    return [...new Set(bandsForRat.filter((b) => b.value === bandValue).map((b) => b.duplex))];
  }, [bandsForRat, bandValue]);

  const hasDuplexChoice = duplexOptions.length > 1 || (duplexOptions.length === 1 && duplexOptions[0] !== null);

  const findBandId = useCallback(
    (value: number | null, dup: string | null): number | null => {
      if (value === null) return null;
      return bandsForRat.find((b) => b.value === value && b.duplex === dup)?.id ?? bandsForRat.find((b) => b.value === value)?.id ?? null;
    },
    [bandsForRat],
  );

  const findPreferredBandId = useCallback(
    (value: number | null, preferredDuplex: string | null, fallbackDuplex?: string): number | null => {
      if (value === null) return null;
      const matchingBands = bandsForRat.filter((b) => b.value === value);
      if (matchingBands.length === 0) return null;
      if (matchingBands.some((b) => b.duplex === preferredDuplex)) return matchingBands.find((b) => b.duplex === preferredDuplex)?.id ?? null;
      if (matchingBands.length === 1) return matchingBands[0]?.id ?? null;
      if (fallbackDuplex && matchingBands.some((b) => b.duplex === fallbackDuplex)) {
        return matchingBands.find((b) => b.duplex === fallbackDuplex)?.id ?? null;
      }
      return matchingBands[0]?.id ?? null;
    },
    [bandsForRat],
  );

  return { bandsForRat, uniqueBandValues, currentBand, bandValue, duplex, duplexOptions, hasDuplexChoice, findBandId, findPreferredBandId };
}
