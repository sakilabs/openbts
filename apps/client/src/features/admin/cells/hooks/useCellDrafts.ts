import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { RAT_ORDER } from "../rat";
import type { CellDraftBase } from "../cellEditRow";
import type { Band } from "@/types/station";

type UseCellDraftsOptions<T extends CellDraftBase> = {
	initialCells: T[];
	initialEnabledRats?: string[];
	allBands: Band[];
	createNewCell: (rat: string, defaultBand: Band) => T;
	onDelete?: (cell: T) => void;
	disabled?: boolean;
};

type UseCellDraftsReturn<T extends CellDraftBase> = {
	cells: T[];
	setCells: React.Dispatch<React.SetStateAction<T[]>>;
	cellsByRat: Record<string, T[]>;
	enabledRats: string[];
	setEnabledRats: React.Dispatch<React.SetStateAction<string[]>>;
	visibleRats: string[];
	toggleRat: (rat: string) => void;
	changeCell: (localId: string, patch: Partial<CellDraftBase>) => void;
	addCell: (rat: string) => void;
	deleteCell: (localId: string) => void;
};

export function useCellDrafts<T extends CellDraftBase>({
	initialCells,
	initialEnabledRats,
	allBands,
	createNewCell,
	onDelete,
	disabled,
}: UseCellDraftsOptions<T>): UseCellDraftsReturn<T> {
	const { t } = useTranslation("stations");

	const [cells, setCells] = useState<T[]>(initialCells);
	const [enabledRats, setEnabledRats] = useState<string[]>(
		() => initialEnabledRats ?? RAT_ORDER.filter((r) => initialCells.some((c) => c.rat === r)),
	);

	const cellsByRat = useMemo(() => {
		const grouped: Record<string, T[]> = {};
		for (const cell of cells) {
			if (!grouped[cell.rat]) grouped[cell.rat] = [];
			grouped[cell.rat].push(cell);
		}
		return grouped;
	}, [cells]);

	const visibleRats = useMemo(() => RAT_ORDER.filter((r) => enabledRats.includes(r)), [enabledRats]);

	const toggleRat = useCallback((rat: string) => {
		setEnabledRats((prev) => (prev.includes(rat) ? prev.filter((r) => r !== rat) : [...prev, rat]));
	}, []);

	const changeCell = useCallback(
		(localId: string, patch: Partial<CellDraftBase>) => {
			if (disabled) return;
			setCells((prev) => prev.map((c) => (c._localId === localId ? { ...c, ...patch } : c)));
		},
		[disabled],
	);

	const addCell = useCallback(
		(rat: string) => {
			if (disabled) return;
			const bandsForRat = allBands.filter((b) => b.rat === rat);
			if (bandsForRat.length === 0) {
				toast.error(t("toast.noBands", { rat }));
				return;
			}
			setCells((prev) => [...prev, createNewCell(rat, bandsForRat[0])]);
		},
		[disabled, allBands, createNewCell, t],
	);

	const deleteCellFn = useCallback(
		(localId: string) => {
			if (disabled) return;
			setCells((prev) => {
				const cell = prev.find((c) => c._localId === localId);
				if (cell && onDelete) onDelete(cell);
				return prev.filter((c) => c._localId !== localId);
			});
		},
		[disabled, onDelete],
	);

	return {
		cells,
		setCells,
		cellsByRat,
		enabledRats,
		setEnabledRats,
		visibleRats,
		toggleRat,
		changeCell,
		addCell,
		deleteCell: deleteCellFn,
	};
}
