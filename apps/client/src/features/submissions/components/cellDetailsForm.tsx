import { useMemo, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { RAT_ICONS } from "@/features/shared/rat";
import { bandsQueryOptions } from "@/features/shared/queries";
import { generateCellId, getCellDiffStatus, buildOriginalCellsMap, type CellDiffStatus } from "../utils/cells";
import type { RatType, ProposedCellForm, GSMCellDetails, UMTSCellDetails, LTECellDetails, NRCellDetails } from "../types";
import type { CellError } from "../utils/validation";
import type { Band } from "@/types/station";

import { getTableHeaders } from "@/features/admin/cells/cellsTableHeaders";
import { CellDetailsFields } from "@/features/admin/cells/cellDetailsFields";
import { useBandSelection } from "@/features/admin/cells/hooks/useBandSelection";

type CellDetailsFormProps = {
	rat: RatType;
	cells: ProposedCellForm[];
	originalCells: ProposedCellForm[];
	isNewStation: boolean;
	cellErrors?: Record<string, CellError>;
	onCellsChange: (rat: RatType, cells: ProposedCellForm[]) => void;
};

function getDefaultCellDetails(rat: RatType): ProposedCellForm["details"] {
	switch (rat) {
		case "GSM":
			return {} as GSMCellDetails;
		case "UMTS":
			return {} as UMTSCellDetails;
		case "LTE":
			return {} as LTECellDetails;
		case "NR":
			return {} as NRCellDetails;
	}
}

export function CellDetailsForm({ rat, cells, originalCells, isNewStation, cellErrors, onCellsChange }: CellDetailsFormProps) {
	const { t } = useTranslation(["submissions", "admin"]);
	const { t: tStation } = useTranslation("stationDetails");

	const { data: allBands = [] } = useQuery(bandsQueryOptions());

	const bandsForRat = useMemo(() => allBands.filter((band) => band.rat === rat), [allBands, rat]);

	const tableHeaders = useMemo(() => getTableHeaders(rat, tStation, { showConfirmed: false }), [rat, tStation]);

	const originalsMap = useMemo(() => buildOriginalCellsMap(originalCells), [originalCells]);

	const diffCounts = useMemo(() => {
		if (isNewStation) return { added: cells.length, modified: 0, deleted: 0 };
		let added = 0;
		let modified = 0;
		for (const cell of cells) {
			const status = getCellDiffStatus(cell, originalsMap);
			if (status === "added") added++;
			else if (status === "modified") modified++;
		}
		const currentExistingIds = new Set(cells.filter((c) => c.existingCellId !== undefined).map((c) => c.existingCellId));
		const deleted = originalCells.filter((c) => c.rat === rat && c.existingCellId !== undefined && !currentExistingIds.has(c.existingCellId)).length;
		return { added, modified, deleted };
	}, [cells, originalsMap, isNewStation, originalCells, rat]);

	const handleAddCell = () => {
		const newCell: ProposedCellForm = {
			id: generateCellId(),
			rat,
			band_id: null,
			details: getDefaultCellDetails(rat),
		};
		onCellsChange(rat, [...cells, newCell]);
	};

	const handleRemoveCell = (id: string) => {
		onCellsChange(
			rat,
			cells.filter((cell) => cell.id !== id),
		);
	};

	const handleCellUpdate = useCallback(
		(cellId: string, patch: Partial<ProposedCellForm>) => {
			onCellsChange(
				rat,
				cells.map((cell) => (cell.id === cellId ? { ...cell, ...patch } : cell)),
			);
		},
		[cells, onCellsChange, rat],
	);

	const handleDetailsChange = useCallback(
		(id: string, field: string, value: number | boolean | undefined) => {
			onCellsChange(
				rat,
				cells.map((cell) => {
					if (cell.id !== id) return cell;
					const newDetails = { ...cell.details } as Record<string, unknown>;
					if (value === undefined) delete newDetails[field];
					else newDetails[field] = value;
					return { ...cell, details: newDetails as ProposedCellForm["details"] };
				}),
			);
		},
		[cells, onCellsChange, rat],
	);

	const handleNotesChange = useCallback(
		(id: string, notes: string) => {
			onCellsChange(
				rat,
				cells.map((cell) => (cell.id === id ? { ...cell, notes: notes || undefined } : cell)),
			);
		},
		[cells, onCellsChange, rat],
	);

	return (
		<Collapsible defaultOpen>
			<div className="border rounded-xl overflow-hidden">
				<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
					<CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
						<HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground group-data-panel-open:rotate-0 -rotate-90" />
						<HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
						<span className="font-semibold text-sm">{rat}</span>
						<span className="text-xs text-muted-foreground">({t("stations:cells.cellsCount", { count: cells.length })})</span>
						{diffCounts.added > 0 && (
							<span className="text-xs text-green-600 flex items-center gap-1">
								<span className="size-1.5 rounded-full bg-green-500" />
								{diffCounts.added} {t("stations:cells.diffAdded")}
							</span>
						)}
						{diffCounts.modified > 0 && (
							<span className="text-xs text-amber-600 flex items-center gap-1">
								<span className="size-1.5 rounded-full bg-amber-500" />
								{diffCounts.modified} {t("stations:cells.diffModified")}
							</span>
						)}
						{diffCounts.deleted > 0 && (
							<span className="text-xs text-red-600 flex items-center gap-1">
								<span className="size-1.5 rounded-full bg-red-500" />
								{diffCounts.deleted} {t("stations:cells.diffDeleted")}
							</span>
						)}
					</CollapsibleTrigger>
					<Button type="button" variant="ghost" size="sm" onClick={handleAddCell} className="h-7 text-xs">
						<HugeiconsIcon icon={Add01Icon} className="size-3.5" />
						{t("stations:cells.addCell")}
					</Button>
				</div>
				<CollapsibleContent>
					{cells.length === 0 ? (
						<div className="px-4 py-6 text-center text-sm text-muted-foreground">{t("stations:cells.noCells")}</div>
					) : (
						<div className="overflow-x-auto custom-scrollbar">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/30">
										{tableHeaders.map((header) => (
											<th key={header} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
												{header}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{cells.map((cell) => {
										const diffStatus: CellDiffStatus = isNewStation ? "added" : getCellDiffStatus(cell, originalsMap);

										return (
											<CellRow
												key={cell.id}
												rat={rat}
												cell={cell}
												diffStatus={diffStatus}
												error={cellErrors?.[cell.id]}
												bands={bandsForRat}
												onUpdate={handleCellUpdate}
												onDetailsChange={handleDetailsChange}
												onNotesChange={handleNotesChange}
												onRemove={handleRemoveCell}
											/>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

type CellRowProps = {
	rat: RatType;
	cell: ProposedCellForm;
	diffStatus: CellDiffStatus;
	error?: CellError;
	bands: Band[];
	onUpdate: (id: string, patch: Partial<ProposedCellForm>) => void;
	onDetailsChange: (id: string, field: string, value: number | boolean | undefined) => void;
	onNotesChange: (id: string, notes: string) => void;
	onRemove: (id: string) => void;
};

const CellRow = memo(function CellRow({ rat, cell, diffStatus, error, bands, onUpdate, onDetailsChange, onNotesChange, onRemove }: CellRowProps) {
	const { t } = useTranslation("submissions");

	const { uniqueBandValues, bandValue, duplex, duplexOptions, hasDuplexChoice, findBandId, bandsForRat } = useBandSelection(
		bands,
		rat,
		cell.band_id ?? -1,
	);

	const handleBandValueChange = (value: number | null) => {
		const opts = value ? [...new Set(bandsForRat.filter((b) => b.value === value).map((b) => b.duplex))] : [];
		const defaultDuplex = opts.length === 1 ? opts[0] : null;
		const newBandId = findBandId(value, defaultDuplex);
		onUpdate(cell.id, { band_id: newBandId });
	};

	const handleDuplexChange = (dup: string | null) => {
		const newBandId = findBandId(bandValue, dup);
		onUpdate(cell.id, { band_id: newBandId });
	};

	const firstCellBorderClass = {
		added: "border-l-2 border-l-green-500",
		modified: "border-l-2 border-l-amber-500",
		unchanged: "",
	}[diffStatus];

	return (
		<tr className="border-b last:border-0 hover:bg-muted/20">
			<td className={cn("px-3 py-1", firstCellBorderClass)}>
				<Select value={bandValue?.toString() ?? ""} onValueChange={(value) => handleBandValueChange(value ? Number.parseInt(value, 10) : null)}>
					<SelectTrigger className={`h-7 w-24 text-sm ${error?.band_id ? "border-destructive" : ""}`}>
						<SelectValue>{bandValue ? `${bandValue} MHz` : t("common:placeholder.selectBand")}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{uniqueBandValues.map((value) => (
							<SelectItem key={value} value={value.toString()}>
								{value} MHz
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</td>
			<td className="px-3 py-1">
				{hasDuplexChoice ? (
					<Select value={duplex ?? "_none"} onValueChange={(value) => handleDuplexChange(value === "_none" ? null : value)}>
						<SelectTrigger className="h-7 w-20 text-sm">
							<SelectValue>{duplex ?? "-"}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{duplexOptions.includes(null) && <SelectItem value="_none">-</SelectItem>}
							{duplexOptions
								.filter((d) => d !== null)
								.map((duplex) => (
									<SelectItem key={duplex} value={duplex}>
										{duplex}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				) : (
					<span className="text-muted-foreground text-xs">-</span>
				)}
			</td>
			<CellDetailsFields
				rat={rat}
				details={cell.details as Record<string, unknown>}
				detailErrors={error?.details}
				onDetailChange={(field, value) => onDetailsChange(cell.id, field, value)}
			/>
			<td className="px-3 py-1">
				<Input
					type="text"
					placeholder={t("stations:cells.notesPlaceholder")}
					value={cell.notes ?? ""}
					onChange={(e) => onNotesChange(cell.id, e.target.value)}
					className="h-7 w-28 text-sm"
				/>
			</td>
			<td className="px-3 py-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => onRemove(cell.id)}
					className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
				>
					<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
				</Button>
			</td>
		</tr>
	);
});
