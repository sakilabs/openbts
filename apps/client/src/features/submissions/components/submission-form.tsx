import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Tick02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StationSelector } from "./station-selector";
import { LocationPicker } from "./location-picker";
import { NewStationForm } from "./new-station-form";
import { RatSelector } from "./rat-selector";
import { CellDetailsForm } from "./cell-details-form";
import { createSubmission, type SearchStation } from "../api";
import { showApiError } from "@/lib/api";
import { generateCellId, computeCellPayloads, cellsToPayloads } from "../utils/cells";
import { validateForm, validateCells, hasErrors, type FormErrors, type CellError } from "../utils/validation";
import type { SubmissionMode, ProposedStationForm, ProposedLocationForm, ProposedCellForm, RatType } from "../types";

type FormValues = {
	mode: SubmissionMode;
	selectedStation: SearchStation | null;
	newStation: ProposedStationForm;
	location: ProposedLocationForm;
	selectedRats: RatType[];
	cells: ProposedCellForm[];
	originalCells: ProposedCellForm[];
};

const INITIAL_VALUES: FormValues = {
	mode: "existing",
	selectedStation: null,
	newStation: { station_id: "", operator_id: null, notes: "" },
	location: { region_id: null, city: "", address: "", longitude: null, latitude: null },
	selectedRats: [],
	cells: [],
	originalCells: [],
};

function stationCellsToForm(station: SearchStation): ProposedCellForm[] {
	return station.cells.map((cell) => ({
		id: generateCellId(),
		existingCellId: cell.id,
		rat: cell.rat as RatType,
		band_id: cell.band_id,
		notes: cell.notes ?? undefined,
		is_confirmed: cell.is_confirmed,
		details: cell.details ?? {},
	}));
}

export function SubmissionForm() {
	const { t } = useTranslation("submissions");
	const [showErrors, setShowErrors] = useState(false);

	const form = useForm({
		defaultValues: INITIAL_VALUES,
		onSubmit: async ({ value }) => {
			const errors = validateForm({
				mode: value.mode,
				selectedStation: value.selectedStation,
				newStation: value.newStation,
				location: value.location,
				cells: value.cells,
			});

			if (hasErrors(errors)) {
				setShowErrors(true);
				return;
			}

			const isNewStation = value.mode === "new";
			const cells = isNewStation ? cellsToPayloads(value.cells) : computeCellPayloads(value.originalCells, value.cells);

			await mutation.mutateAsync({
				station_id: isNewStation ? null : (value.selectedStation?.id ?? null),
				type: isNewStation ? "new" : "update",
				station: isNewStation ? value.newStation : undefined,
				location: isNewStation ? value.location : undefined,
				cells,
			});
		},
	});

	const mutation = useMutation({
		mutationFn: createSubmission,
		onSuccess: () => {
			toast.success(t("form.submitSuccess"));
			form.reset();
			setShowErrors(false);
		},
		onError: showApiError,
	});

	const handleModeChange = (newMode: SubmissionMode) => {
		form.setFieldValue("mode", newMode);
		if (newMode === "existing") {
			form.setFieldValue("newStation", INITIAL_VALUES.newStation);
			form.setFieldValue("location", INITIAL_VALUES.location);
		} else {
			form.setFieldValue("selectedStation", null);
			form.setFieldValue("cells", []);
			form.setFieldValue("originalCells", []);
			form.setFieldValue("selectedRats", []);
		}
	};

	const handleStationSelect = (station: SearchStation | null) => {
		form.setFieldValue("selectedStation", station);
		if (station) {
			const cells = stationCellsToForm(station);
			form.setFieldValue("cells", cells);
			form.setFieldValue("originalCells", structuredClone(cells));
			form.setFieldValue("selectedRats", [...new Set(cells.map((c) => c.rat))]);
		} else {
			form.setFieldValue("cells", []);
			form.setFieldValue("originalCells", []);
			form.setFieldValue("selectedRats", []);
		}
	};

	const handleRatsChange = (rats: RatType[]) => {
		form.setFieldValue("selectedRats", rats);
		form.setFieldValue(
			"cells",
			form.getFieldValue("cells").filter((c) => rats.includes(c.rat)),
		);
	};

	const handleCellsChange = (rat: RatType, updatedCells: ProposedCellForm[]) => {
		const otherCells = form.getFieldValue("cells").filter((c) => c.rat !== rat);
		form.setFieldValue("cells", [...otherCells, ...updatedCells]);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			onKeyDown={(e) => {
				if (e.key !== "Enter") return;
				const target = e.target as HTMLElement | null;
				if (!target) return;
				const tagName = target.tagName;
				if (tagName === "INPUT" || tagName === "SELECT") e.preventDefault();
			}}
			className="flex flex-col lg:flex-row gap-4 h-full"
		>
			<div className="w-full lg:flex-2 space-y-3">
				<form.Subscribe selector={(s) => ({ mode: s.values.mode, selectedStation: s.values.selectedStation })}>
					{({ mode, selectedStation }) => (
						<StationSelector
							mode={mode}
							selectedStation={selectedStation}
							onModeChange={handleModeChange}
							onStationSelect={handleStationSelect}
						/>
					)}
				</form.Subscribe>

				<form.Subscribe selector={(s) => ({ mode: s.values.mode, newStation: s.values.newStation, location: s.values.location })}>
					{({ mode, newStation, location }) => {
						if (mode !== "new") return null;

						const errors: FormErrors = showErrors
							? validateForm({
									mode,
									selectedStation: null,
									newStation,
									location,
									cells: [],
								})
							: {};

						return (
							<>
								<NewStationForm
									station={newStation}
									errors={errors.station}
									onStationChange={(s) => form.setFieldValue("newStation", s)}
								/>
								<LocationPicker
									location={location}
									errors={errors.location}
									onLocationChange={(patch) => {
										const current = form.getFieldValue("location");
										form.setFieldValue("location", { ...current, ...patch });
									}}
								/>
							</>
						);
					}}
				</form.Subscribe>

				<form.Subscribe selector={(s) => s.values.selectedRats}>
					{(selectedRats) => <RatSelector selectedRats={selectedRats} onRatsChange={handleRatsChange} />}
				</form.Subscribe>

				<form.Subscribe selector={(s) => ({ mode: s.values.mode, selectedStation: s.values.selectedStation, newStation: s.values.newStation, cellsCount: s.values.cells.length, canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
					{({ mode, selectedStation, newStation, cellsCount, canSubmit, isSubmitting }) => (
						<SubmitSection
							mode={mode}
							selectedStation={selectedStation}
							newStation={newStation}
							cellsCount={cellsCount}
							canSubmit={canSubmit}
							isSubmitting={isSubmitting}
							isPending={mutation.isPending}
							isSuccess={mutation.isSuccess}
						/>
					)}
				</form.Subscribe>
			</div>

			<div className="border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:flex-3 min-w-0">
				<form.Subscribe
					selector={(s) => ({
						selectedRats: s.values.selectedRats,
						cells: s.values.cells,
						originalCells: s.values.originalCells,
						mode: s.values.mode,
					})}
				>
					{({ selectedRats, cells, originalCells, mode }) => {
						const cellErrors = showErrors
							? validateCells(cells)
							: undefined;

						return (
							<CellsSection
								selectedRats={selectedRats}
								cells={cells}
								originalCells={originalCells}
								isNewStation={mode === "new"}
								cellErrors={cellErrors ? (Object.keys(cellErrors).length > 0 ? cellErrors : undefined) : undefined}
								onCellsChange={handleCellsChange}
							/>
						);
					}}
				</form.Subscribe>
			</div>
		</form>
	);
}

type SubmitSectionProps = {
	mode: SubmissionMode;
	selectedStation: SearchStation | null;
	newStation: ProposedStationForm;
	cellsCount: number;
	canSubmit: boolean;
	isSubmitting: boolean;
	isPending: boolean;
	isSuccess: boolean;
};

function SubmitSection({ mode, selectedStation, newStation, cellsCount, canSubmit, isSubmitting, isPending, isSuccess }: SubmitSectionProps) {
	const { t } = useTranslation("submissions");

	const statusText =
		mode === "existing"
			? selectedStation
				? t("form.updateStation", { id: selectedStation.station_id })
				: t("form.selectStationFirst")
			: newStation.station_id
				? t("form.createStation", { id: newStation.station_id })
				: t("form.fillStationDetails");

	const buttonIcon = isSuccess ? Tick02Icon : SentIcon;

	const isLoading = isSubmitting || isPending;
	const buttonText = isLoading ? t("form.submitting") : isSuccess ? t("form.submitted") : t("form.submit");

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-3 bg-muted/30 space-y-3">
				<div className="text-xs text-muted-foreground">
					{statusText}
					{cellsCount > 0 && <span className="ml-1">· {t("form.cellsCount", { count: cellsCount })}</span>}
				</div>
				<Button type="submit" disabled={!canSubmit || isSubmitting || isPending} size="sm" className="w-full h-8">
					{buttonText}
					{isLoading ? <Spinner data-icon="inline-end" /> : <HugeiconsIcon icon={buttonIcon} className="size-3.5" data-icon="inline-end" />}
				</Button>
			</div>
		</div>
	);
}

type CellsSectionProps = {
	selectedRats: RatType[];
	cells: ProposedCellForm[];
	originalCells: ProposedCellForm[];
	isNewStation: boolean;
	cellErrors?: Record<string, CellError>;
	onCellsChange: (rat: RatType, cells: ProposedCellForm[]) => void;
};

function CellsSection({ selectedRats, cells, originalCells, isNewStation, cellErrors, onCellsChange }: CellsSectionProps) {
	const { t } = useTranslation("submissions");

	const cellsByRat = useMemo(() => {
		const map = new Map<RatType, ProposedCellForm[]>();
		for (const cell of cells) {
			const list = map.get(cell.rat) ?? [];
			list.push(cell);
			map.set(cell.rat, list);
		}
		return map;
	}, [cells]);

	if (selectedRats.length === 0) {
		return (
			<div className="border rounded-xl h-full min-h-32 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
				{t("ratSelector.noSelection")}
			</div>
		);
	}

	return (
		<div className="space-y-3 pb-4">
			{selectedRats.map((rat) => (
				<CellDetailsForm
					key={rat}
					rat={rat}
					cells={cellsByRat.get(rat) ?? []}
					originalCells={originalCells}
					isNewStation={isNewStation}
					cellErrors={cellErrors}
					onCellsChange={onCellsChange}
				/>
			))}
		</div>
	);
}
