import { useMemo, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, SignalFull02Icon, Wifi01Icon, SmartPhone01Icon, FlashIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchBands } from "../api";
import { generateCellId, getCellDiffStatus, buildOriginalCellsMap, type CellDiffStatus } from "../utils/cells";
import type { RatType, ProposedCellForm, GSMCellDetails, UMTSCellDetails, LTECellDetails, NRCellDetails } from "../types";
import type { CellError } from "../utils/validation";

const RAT_ICONS: Record<RatType, typeof SignalFull02Icon> = {
	GSM: SignalFull02Icon,
	UMTS: Wifi01Icon,
	LTE: SmartPhone01Icon,
	NR: FlashIcon,
};

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

function getTableHeaders(rat: RatType, t: (key: string) => string): string[] {
	switch (rat) {
		case "GSM":
			return [t("cellDetails.band"), t("cellDetails.duplex"), "LAC", "CID", "E-GSM", t("cellDetails.notes"), ""];
		case "UMTS":
			return [t("cellDetails.band"), t("cellDetails.duplex"), "LAC", "RNC", "CID", "LongCID", "Carrier", t("cellDetails.notes"), ""];
		case "LTE":
			return [t("cellDetails.band"), t("cellDetails.duplex"), "TAC", "eNBID", "CLID", "E-CID", "NB-IoT", t("cellDetails.notes"), ""];
		case "NR":
			return [t("cellDetails.band"), t("cellDetails.duplex"), "TAC", "gNBID", "CLID", "NCI", "PCI", "RedCap", t("cellDetails.notes"), ""];
	}
}

export function CellDetailsForm({ rat, cells, originalCells, isNewStation, cellErrors, onCellsChange }: CellDetailsFormProps) {
	const { t } = useTranslation("submissions");

	const { data: allBands = [] } = useQuery({
		queryKey: ["bands"],
		queryFn: fetchBands,
		staleTime: 1000 * 60 * 30,
	});

	const bandsForRat = useMemo(() => allBands.filter((band) => band.rat === rat), [allBands, rat]);

	const uniqueBandValues = useMemo(() => [...new Set(bandsForRat.map((b) => b.value))].sort((a, b) => a - b), [bandsForRat]);

	const tableHeaders = useMemo(() => getTableHeaders(rat, t), [rat, t]);

	const originalsMap = useMemo(() => buildOriginalCellsMap(originalCells), [originalCells]);

	const diffCounts = useMemo(() => {
		if (isNewStation) return { added: cells.length, modified: 0 };
		let added = 0;
		let modified = 0;
		for (const cell of cells) {
			const status = getCellDiffStatus(cell, originalsMap);
			if (status === "added") added++;
			else if (status === "modified") modified++;
		}
		return { added, modified };
	}, [cells, originalsMap, isNewStation]);

	const getDuplexOptionsForValue = useCallback(
		(value: number): (string | null)[] => {
			const bands = bandsForRat.filter((b) => b.value === value);
			return [...new Set(bands.map((b) => b.duplex))];
		},
		[bandsForRat],
	);

	const findBandId = useCallback(
		(value: number | null, duplex: string | null): number | null => {
			if (value === null) return null;
			const band = bandsForRat.find((b) => b.value === value && b.duplex === duplex);
			if (band) return band.id;
			const fallback = bandsForRat.find((b) => b.value === value);
			return fallback?.id ?? null;
		},
		[bandsForRat],
	);

	const getCellLocalState = useCallback(
		(cell: ProposedCellForm): { bandValue: number | null; duplex: string | null } => {
			if (!cell.band_id) return { bandValue: null, duplex: null };
			const band = bandsForRat.find((b) => b.id === cell.band_id);
			return { bandValue: band?.value ?? null, duplex: band?.duplex ?? null };
		},
		[bandsForRat],
	);

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

	const handleBandValueChange = (cellId: string, value: number | null) => {
		const duplexOptions = value ? getDuplexOptionsForValue(value) : [];
		const defaultDuplex = duplexOptions.length === 1 ? duplexOptions[0] : null;
		const bandId = findBandId(value, defaultDuplex);

		onCellsChange(
			rat,
			cells.map((cell) => (cell.id === cellId ? { ...cell, band_id: bandId } : cell)),
		);
	};

	const handleDuplexChange = (cellId: string, duplex: string | null) => {
		const cell = cells.find((c) => c.id === cellId);
		if (!cell) return;

		const localState = getCellLocalState(cell);
		const bandId = findBandId(localState.bandValue, duplex);

		onCellsChange(
			rat,
			cells.map((c) => (c.id === cellId ? { ...c, band_id: bandId } : c)),
		);
	};

	const handleDetailsChange = (id: string, field: string, value: number | boolean | undefined) => {
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
	};

	const handleNotesChange = (id: string, notes: string) => {
		onCellsChange(
			rat,
			cells.map((cell) => (cell.id === id ? { ...cell, notes: notes || undefined } : cell)),
		);
	};

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
					<span className="font-semibold text-sm">{rat}</span>
					<span className="text-xs text-muted-foreground">({t("cellDetails.cellsCount", { count: cells.length })})</span>
					{diffCounts.added > 0 && (
						<span className="text-xs text-green-600 flex items-center gap-1">
							<span className="size-1.5 rounded-full bg-green-500" />
							{diffCounts.added} {t("cellDetails.diffAdded")}
						</span>
					)}
					{diffCounts.modified > 0 && (
						<span className="text-xs text-amber-600 flex items-center gap-1">
							<span className="size-1.5 rounded-full bg-amber-500" />
							{diffCounts.modified} {t("cellDetails.diffModified")}
						</span>
					)}
				</div>
				<Button type="button" variant="ghost" size="sm" onClick={handleAddCell} className="h-7 text-xs">
					<HugeiconsIcon icon={Add01Icon} className="size-3.5" />
					{t("cellDetails.addCell")}
				</Button>
			</div>

			{cells.length === 0 ? (
				<div className="px-4 py-6 text-center text-sm text-muted-foreground">{t("cellDetails.noCells")}</div>
			) : (
				<div className="overflow-x-auto">
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
										uniqueBandValues={uniqueBandValues}
										getCellLocalState={getCellLocalState}
										getDuplexOptionsForValue={getDuplexOptionsForValue}
										onBandValueChange={handleBandValueChange}
										onDuplexChange={handleDuplexChange}
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
		</div>
	);
}

type CellRowProps = {
	rat: RatType;
	cell: ProposedCellForm;
	diffStatus: CellDiffStatus;
	error?: CellError;
	uniqueBandValues: number[];
	getCellLocalState: (cell: ProposedCellForm) => { bandValue: number | null; duplex: string | null };
	getDuplexOptionsForValue: (value: number) => (string | null)[];
	onBandValueChange: (cellId: string, value: number | null) => void;
	onDuplexChange: (cellId: string, duplex: string | null) => void;
	onDetailsChange: (id: string, field: string, value: number | boolean | undefined) => void;
	onNotesChange: (id: string, notes: string) => void;
	onRemove: (id: string) => void;
};

const CellRow = memo(function CellRow({
	rat,
	cell,
	diffStatus,
	error,
	uniqueBandValues,
	getCellLocalState,
	getDuplexOptionsForValue,
	onBandValueChange,
	onDuplexChange,
	onDetailsChange,
	onNotesChange,
	onRemove,
}: CellRowProps) {
	const { t } = useTranslation("submissions");
	const localState = getCellLocalState(cell);
	const duplexOptions = localState.bandValue ? getDuplexOptionsForValue(localState.bandValue) : [];
	const hasDuplexChoice = duplexOptions.length > 1 || (duplexOptions.length === 1 && duplexOptions[0] !== null);

	const rowClassName = {
		added: "border-b last:border-0 hover:bg-muted/20 border-l-2 border-l-green-500",
		modified: "border-b last:border-0 hover:bg-muted/20 border-l-2 border-l-amber-500",
		unchanged: "border-b last:border-0 hover:bg-muted/20",
	}[diffStatus];

	return (
		<tr className={rowClassName}>
			<td className="px-4 py-2">
				<Select
					value={localState.bandValue?.toString() ?? ""}
					onValueChange={(value) => onBandValueChange(cell.id, value ? Number.parseInt(value, 10) : null)}
				>
					<SelectTrigger className={`h-8 w-24 text-sm ${error?.band_id ? "border-destructive" : ""}`}>
						<SelectValue>{localState.bandValue ? `${localState.bandValue} MHz` : t("cellDetails.selectBand")}</SelectValue>
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
			<td className="px-4 py-2">
				{hasDuplexChoice ? (
					<Select value={localState.duplex ?? "_none"} onValueChange={(value) => onDuplexChange(cell.id, value === "_none" ? null : value)}>
						<SelectTrigger className="h-8 w-20 text-sm">
							<SelectValue>{localState.duplex ?? "-"}</SelectValue>
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
			<CellDetailsFields rat={rat} cell={cell} detailErrors={error?.details} onDetailsChange={onDetailsChange} />
			<td className="px-4 py-2">
				<Input
					type="text"
					placeholder={t("cellDetails.notesPlaceholder")}
					value={cell.notes ?? ""}
					onChange={(e) => onNotesChange(cell.id, e.target.value)}
					className="h-8 w-28 text-sm"
				/>
			</td>
			<td className="px-4 py-2">
				{!cell.is_confirmed && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onRemove(cell.id)}
						className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
					>
						<HugeiconsIcon icon={Delete02Icon} className="size-4" />
					</Button>
				)}
			</td>
		</tr>
	);
});

type CellDetailsFieldsProps = {
	rat: RatType;
	cell: ProposedCellForm;
	detailErrors?: Record<string, string>;
	onDetailsChange: (id: string, field: string, value: number | boolean | undefined) => void;
};

function CellDetailsFields({ rat, cell, detailErrors, onDetailsChange }: CellDetailsFieldsProps) {
	const handleChange = (field: string, value: string) => {
		onDetailsChange(cell.id, field, value ? Number.parseInt(value, 10) : undefined);
	};

	const renderInput = (field: string, value: number | undefined, placeholder: string) => (
		<td className="px-4 py-2">
			<Input
				type="number"
				min={0}
				placeholder={placeholder}
				value={value ?? ""}
				onChange={(e) => handleChange(field, e.target.value)}
				className={`h-8 w-20 font-mono text-sm ${detailErrors?.[field] ? "border-destructive" : ""}`}
			/>
		</td>
	);

	const renderComputed = (value: number | null) => (
		<td className="px-4 py-2">
			<span className="font-mono text-sm text-muted-foreground">{value !== null ? value : "-"}</span>
		</td>
	);

	switch (rat) {
		case "GSM": {
			const details = cell.details as GSMCellDetails;
			return (
				<>
					{renderInput("lac", details.lac, "LAC")}
					{renderInput("cid", details.cid, "CID")}
					<td className="px-4 py-2">
						<Checkbox checked={details.is_egsm ?? false} onCheckedChange={(checked) => onDetailsChange(cell.id, "is_egsm", checked === true)} />
					</td>
				</>
			);
		}
		case "UMTS": {
			const details = cell.details as UMTSCellDetails;
			const longCid = details.rnc !== undefined && details.cid !== undefined ? details.rnc * 65536 + details.cid : null;
			return (
				<>
					{renderInput("lac", details.lac, "LAC")}
					{renderInput("rnc", details.rnc, "RNC")}
					{renderInput("cid", details.cid, "CID")}
					{renderComputed(longCid)}
					{renderInput("carrier", details.carrier, "Carrier")}
				</>
			);
		}
		case "LTE": {
			const details = cell.details as LTECellDetails;
			const eCid = details.enbid !== undefined && details.clid !== undefined ? details.enbid * 256 + details.clid : null;
			return (
				<>
					{renderInput("tac", details.tac, "TAC")}
					{renderInput("enbid", details.enbid, "eNBID")}
					{renderInput("clid", details.clid, "CLID")}
					{renderComputed(eCid)}
					<td className="px-4 py-2">
						<Checkbox
							checked={details.supports_nb_iot ?? false}
							onCheckedChange={(checked) => onDetailsChange(cell.id, "supports_nb_iot", checked === true)}
						/>
					</td>
				</>
			);
		}
		case "NR": {
			const details = cell.details as NRCellDetails;
			const nci = details.gnbid !== undefined && details.clid !== undefined ? details.gnbid * 4096 + details.clid : null;
			return (
				<>
					{renderInput("nrtac", details.nrtac, "TAC")}
					{renderInput("gnbid", details.gnbid, "gNBID")}
					{renderInput("clid", details.clid, "CLID")}
					{renderComputed(nci)}
					{renderInput("pci", details.pci, "PCI")}
					<td className="px-4 py-2">
						<Checkbox
							checked={details.supports_nr_redcap ?? false}
							onCheckedChange={(checked) => onDetailsChange(cell.id, "supports_nr_redcap", checked === true)}
						/>
					</td>
				</>
			);
		}
	}
}
