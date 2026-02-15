import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Tick02Icon, PencilEdit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StationSelector } from "./stationSelector";
import { LocationPicker } from "./locationPicker";
import { NewStationForm } from "./newStationForm";
import { RatSelector } from "./ratSelector";
import { CellDetailsForm } from "./cellDetailsForm";
import { createSubmission, updateSubmission, fetchSubmissionForEdit, fetchStationForSubmission, type SearchStation } from "../api";
import { cn } from "@/lib/utils";
import { generateCellId, computeCellPayloads, cellsToPayloads, ukePermitsToCells } from "../utils/cells";
import { validateForm, validateCells, hasErrors, type FormErrors, type CellError } from "../utils/validation";
import type { SubmissionMode, StationAction, ProposedStationForm, ProposedLocationForm, ProposedCellForm, RatType } from "../types";
import type { UkeStation } from "@/types/station";

type FormValues = {
	mode: SubmissionMode;
	action: StationAction;
	selectedStation: SearchStation | null;
	newStation: ProposedStationForm;
	location: ProposedLocationForm;
	selectedRats: RatType[];
	cells: ProposedCellForm[];
	originalCells: ProposedCellForm[];
	submitterNote: string;
};

const INITIAL_VALUES: FormValues = {
	mode: "new",
	action: "update",
	selectedStation: null,
	newStation: { station_id: "", operator_id: null, notes: "" },
	location: { region_id: null, city: "", address: "", longitude: null, latitude: null },
	selectedRats: [],
	cells: [],
	originalCells: [],
	submitterNote: "",
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

type SubmissionFormProps = {
	preloadStationId?: number;
	editSubmissionId?: string;
};

export function SubmissionForm({ preloadStationId, editSubmissionId }: SubmissionFormProps) {
	const { t } = useTranslation(["submissions", "common"]);
	const queryClient = useQueryClient();
	const [showErrors, setShowErrors] = useState(false);

	const { data: preloadedStation } = useQuery({
		queryKey: ["station-for-submission", preloadStationId],
		queryFn: () => fetchStationForSubmission(preloadStationId ?? 0),
		enabled: !!preloadStationId,
		staleTime: 1000 * 60 * 5,
	});

	const isEditMode = !!editSubmissionId;

	const { data: editSubmission } = useQuery({
		queryKey: ["submission-edit", editSubmissionId],
		queryFn: () => fetchSubmissionForEdit(editSubmissionId!),
		enabled: isEditMode,
		staleTime: 1000 * 60 * 5,
	});

	const form = useForm({
		defaultValues: INITIAL_VALUES,
		onSubmit: async ({ value }) => {
			const activeCells = value.cells.filter((c) => value.selectedRats.includes(c.rat));

			const errors = validateForm({
				mode: value.mode,
				selectedStation: value.selectedStation,
				newStation: value.newStation,
				location: value.location,
				cells: activeCells,
			});

			if (hasErrors(errors)) {
				setShowErrors(true);
				return;
			}

			const isNewStation = value.mode === "new";
			const isDeleteMode = value.action === "delete";
			const cells = isNewStation ? cellsToPayloads(activeCells) : computeCellPayloads(value.originalCells, activeCells);

			const hasLocation = value.location.latitude !== null && value.location.longitude !== null;

			const submissionType = isDeleteMode ? "delete" : isNewStation ? "new" : "update";

			await mutation.mutateAsync({
				station_id: isNewStation ? null : (value.selectedStation?.id ?? null),
				type: submissionType,
				submitter_note: value.submitterNote || undefined,
				station: isNewStation ? value.newStation : undefined,
				location: hasLocation && !isDeleteMode ? value.location : undefined,
				cells: isDeleteMode ? [] : cells,
			});
		},
	});

	const mutation = useMutation({
		mutationFn: isEditMode
			? (data: Parameters<typeof updateSubmission>[1]) => updateSubmission(editSubmissionId!, data)
			: createSubmission,
		onSuccess: () => {
			toast.success(t(isEditMode ? "toast.updated" : "toast.submitted"));
			if (isEditMode) {
				queryClient.invalidateQueries({ queryKey: ["submission-edit", editSubmissionId] });
			} else {
				form.reset();
			}
			setShowErrors(false);
		},
		onError: () => {
			toast.error(t("common:error.toast"));
		},
	});

	const handleModeChange = (newMode: SubmissionMode) => {
		form.setFieldValue("mode", newMode);
		form.setFieldValue("action", "update");
		form.setFieldValue("location", INITIAL_VALUES.location);
		form.setFieldValue("submitterNote", "");
		if (newMode === "existing") {
			form.setFieldValue("newStation", INITIAL_VALUES.newStation);
			form.setFieldValue("selectedStation", null);
			form.setFieldValue("cells", []);
			form.setFieldValue("originalCells", []);
			form.setFieldValue("selectedRats", []);
		} else {
			form.setFieldValue("selectedStation", null);
			form.setFieldValue("cells", []);
			form.setFieldValue("originalCells", []);
			form.setFieldValue("selectedRats", []);
		}
	};

	const handleActionChange = (action: StationAction) => {
		form.setFieldValue("action", action);
		if (action === "delete") {
			form.setFieldValue("submitterNote", "");
		}
	};

	const loadStation = useCallback(
		(station: SearchStation | null) => {
			form.setFieldValue("selectedStation", station);
			form.setFieldValue("action", "update");

			if (station) {
				const cells = stationCellsToForm(station);
				form.setFieldValue("cells", cells);
				form.setFieldValue("originalCells", structuredClone(cells));
				form.setFieldValue("selectedRats", [...new Set(cells.map((c) => c.rat))]);

				if (station.location) {
					form.setFieldValue("location", {
						latitude: station.location.latitude,
						longitude: station.location.longitude,
						city: station.location.city ?? "",
						address: station.location.address ?? "",
						region_id: station.location.region?.id ?? null,
					});
				}
			} else {
				form.setFieldValue("cells", []);
				form.setFieldValue("originalCells", []);
				form.setFieldValue("selectedRats", []);
				form.setFieldValue("location", INITIAL_VALUES.location);
			}
		},
		[form],
	);

	const handleStationSelect = (station: SearchStation | null) => {
		loadStation(station);
	};

	const handleUkeStationSelect = useCallback(
		(station: UkeStation) => {
			form.setFieldValue("mode", "new");
			form.setFieldValue("selectedStation", null);
			form.setFieldValue("newStation", {
				station_id: station.station_id,
				operator_id: station.operator?.id ?? null,
				notes: "",
			});

			if (station.location) {
				form.setFieldValue("location", {
					latitude: station.location.latitude,
					longitude: station.location.longitude,
					city: station.location.city ?? "",
					address: station.location.address ?? "",
					region_id: station.location.region?.id ?? null,
				});
			}

			const cells = ukePermitsToCells(station.permits);
			form.setFieldValue("cells", cells);
			form.setFieldValue("originalCells", []);
			form.setFieldValue("selectedRats", [...new Set(cells.map((c) => c.rat))]);
		},
		[form],
	);

	const lastAppliedStationId = useRef<number | null>(null);

	useEffect(() => {
		if (preloadedStation) {
			if (preloadedStation.id !== lastAppliedStationId.current) {
				lastAppliedStationId.current = preloadedStation.id;

				form.setFieldValue("mode", "existing");
				form.setFieldValue("newStation", INITIAL_VALUES.newStation);
				loadStation(preloadedStation);
			}
		} else if (!preloadStationId) {
			lastAppliedStationId.current = null;
		}
	}, [preloadedStation, preloadStationId, form, loadStation]);

	const lastAppliedEditKey = useRef<string | null>(null);

	useEffect(() => {
		if (!editSubmission) return;
		const editKey = `${editSubmission.id}:${editSubmission.updatedAt}`;
		if (editKey === lastAppliedEditKey.current) return;
		lastAppliedEditKey.current = editKey;

		let ignore = false;

		const isNew = editSubmission.type === "new";
		form.setFieldValue("mode", isNew ? "new" : "existing");
		form.setFieldValue("action", editSubmission.type === "delete" ? "delete" : "update");
		form.setFieldValue("submitterNote", editSubmission.submitter_note ?? "");

		if (!isNew && editSubmission.station) {
			fetchStationForSubmission(editSubmission.station.id).then((station) => {
				if (!ignore) loadStation(station);
			});
		} else if (isNew && editSubmission.proposedStation) {
			form.setFieldValue("newStation", {
				station_id: editSubmission.proposedStation.station_id ?? "",
				operator_id: editSubmission.proposedStation.operator_id,
				notes: editSubmission.proposedStation.notes ?? "",
			});
		}

		if (editSubmission.proposedLocation) {
			form.setFieldValue("location", {
				region_id: editSubmission.proposedLocation.region_id,
				city: editSubmission.proposedLocation.city ?? "",
				address: editSubmission.proposedLocation.address ?? "",
				longitude: editSubmission.proposedLocation.longitude,
				latitude: editSubmission.proposedLocation.latitude,
			});
		}

		const cells: ProposedCellForm[] = editSubmission.cells.map((cell) => ({
			id: generateCellId(),
			existingCellId: cell.target_cell_id ?? undefined,
			rat: cell.rat as RatType,
			band_id: cell.band_id,
			notes: cell.notes ?? undefined,
			is_confirmed: cell.is_confirmed,
			details: cell.details ?? {},
		}));
		form.setFieldValue("cells", cells);
		form.setFieldValue("originalCells", structuredClone(cells));
		form.setFieldValue("selectedRats", [...new Set(cells.map((c) => c.rat))]);

		return () => {
			ignore = true;
		};
	}, [editSubmission, form, loadStation]);

	const handleRatsChange = (rats: RatType[]) => {
		form.setFieldValue("selectedRats", rats);
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
			{isEditMode && (
				<div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 flex items-center gap-2.5">
					<HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
					<p className="text-sm text-muted-foreground">
						{t("form.editingBanner")} <span className="font-mono font-semibold text-foreground">#{editSubmissionId}</span>
					</p>
				</div>
			)}
				<form.Subscribe selector={(s) => ({ mode: s.values.mode, selectedStation: s.values.selectedStation })}>
					{({ mode, selectedStation }) => (
						<StationSelector mode={mode} selectedStation={selectedStation} onModeChange={handleModeChange} onStationSelect={handleStationSelect} />
					)}
				</form.Subscribe>

				<form.Subscribe selector={(s) => ({ mode: s.values.mode, action: s.values.action, selectedStation: s.values.selectedStation })}>
					{({ mode, action, selectedStation }) => {
						if (mode !== "existing" || !selectedStation) return null;
						return <ActionSelector action={action} onActionChange={handleActionChange} />;
					}}
				</form.Subscribe>

				<form.Subscribe
					selector={(s) => ({ mode: s.values.mode, action: s.values.action, selectedStation: s.values.selectedStation, location: s.values.location })}
				>
					{({ mode, action, selectedStation, location }) => {
						if (mode === "existing" && action === "delete") return null;
						if (mode === "existing" && !selectedStation) return null;

						const errors: FormErrors = showErrors
							? validateForm({
									mode,
									selectedStation,
									newStation: form.getFieldValue("newStation"),
									location,
									cells: [],
								})
							: {};

						return (
							<LocationPicker
								location={location}
								errors={errors.location}
								onLocationChange={(patch) => {
									const current = form.getFieldValue("location");
									form.setFieldValue("location", { ...current, ...patch });
								}}
								onUkeStationSelect={mode === "new" ? handleUkeStationSelect : undefined}
							/>
						);
					}}
				</form.Subscribe>

				<form.Subscribe selector={(s) => ({ mode: s.values.mode, newStation: s.values.newStation, location: s.values.location })}>
					{({ mode, newStation, location }) => {
						if (mode !== "new") return null;
						const isLocationSet = location.latitude !== null && location.longitude !== null && location.region_id !== null;
						if (!isLocationSet) return null;

						const errors: FormErrors = showErrors
							? validateForm({
									mode,
									selectedStation: null,
									newStation,
									location,
									cells: [],
								})
							: {};

						return <NewStationForm station={newStation} errors={errors.station} onStationChange={(s) => form.setFieldValue("newStation", s)} />;
					}}
				</form.Subscribe>

				<form.Subscribe
					selector={(s) => ({
						mode: s.values.mode,
						action: s.values.action,
						selectedStation: s.values.selectedStation,
						selectedRats: s.values.selectedRats,
						location: s.values.location,
					})}
				>
					{({ mode, action, selectedStation, selectedRats, location }) => {
						if (mode === "existing" && action === "delete") return null;
						if (mode === "new") {
							const isLocationSet = location.latitude !== null && location.longitude !== null && location.region_id !== null;
							if (!isLocationSet) return null;
						} else if (!selectedStation) {
							return null;
						}

						return <RatSelector selectedRats={selectedRats} onRatsChange={handleRatsChange} />;
					}}
				</form.Subscribe>

				<form.Subscribe
					selector={(s) => ({
						mode: s.values.mode,
						action: s.values.action,
						selectedStation: s.values.selectedStation,
						newStation: s.values.newStation,
						cellsCount: s.values.cells.filter((c) => s.values.selectedRats.includes(c.rat)).length,
						submitterNote: s.values.submitterNote,
						canSubmit: s.canSubmit,
						isSubmitting: s.isSubmitting,
					})}
				>
					{({ mode, action, selectedStation, newStation, cellsCount, submitterNote, canSubmit, isSubmitting }) => (
					<SubmitSection
						mode={mode}
						action={action}
						selectedStation={selectedStation}
						newStation={newStation}
						cellsCount={cellsCount}
						submitterNote={submitterNote}
						onSubmitterNoteChange={(note) => form.setFieldValue("submitterNote", note)}
						canSubmit={canSubmit}
						isSubmitting={isSubmitting}
						isPending={mutation.isPending}
						isSuccess={mutation.isSuccess}
						isEditMode={isEditMode}
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
						action: s.values.action,
					})}
				>
					{({ selectedRats, cells, originalCells, mode, action }) => {
						if (mode === "existing" && action === "delete") {
							return (
								<div className="border rounded-xl h-full min-h-32 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
									{t("deleteStation.warning")}
								</div>
							);
						}

						const cellErrors = showErrors ? validateCells(cells) : undefined;

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
	action: StationAction;
	selectedStation: SearchStation | null;
	newStation: ProposedStationForm;
	cellsCount: number;
	submitterNote: string;
	onSubmitterNoteChange: (note: string) => void;
	canSubmit: boolean;
	isSubmitting: boolean;
	isPending: boolean;
	isSuccess: boolean;
	isEditMode: boolean;
};

function SubmitSection({
	mode,
	action,
	selectedStation,
	submitterNote,
	onSubmitterNoteChange,
	canSubmit,
	isSubmitting,
	isPending,
	isSuccess,
	isEditMode,
}: SubmitSectionProps) {
	const { t } = useTranslation(["submissions", "common"]);

	const isDeleteAction = action === "delete";

	const notePlaceholder = isDeleteAction ? t("deleteStation.reasonPlaceholder") : t("form.summaryPlaceholder");

	const buttonIcon = isSuccess ? Tick02Icon : SentIcon;

	const isLoading = isSubmitting || isPending;
	const buttonText = isLoading
		? t(isEditMode ? "common:actions.updating" : "common:actions.submitting")
		: isSuccess
			? t("common:actions.submitted")
			: isEditMode
				? t("common:actions.update")
				: t("common:actions.submit");

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-3 bg-muted/30 space-y-3">
				{!isDeleteAction && <div className="text-xs text-muted-foreground">{t("form.summary")}</div>}
				{isDeleteAction && <div className="text-xs text-amber-600 dark:text-amber-500">{t("deleteStation.warning")}</div>}
				{(mode === "new" || selectedStation) && (
					<Textarea
						placeholder={notePlaceholder}
						value={submitterNote}
						onChange={(e) => onSubmitterNoteChange(e.target.value)}
						className="min-h-15 text-sm resize-none"
						rows={2}
					/>
				)}
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
	const { t } = useTranslation(["submissions", "common"]);

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

type ActionSelectorProps = {
	action: StationAction;
	onActionChange: (action: StationAction) => void;
};

function ActionSelector({ action, onActionChange }: ActionSelectorProps) {
	const { t } = useTranslation(["submissions", "common"]);

	return (
		<div
			className={cn(
				"border-2 rounded-xl bg-card overflow-hidden transition-colors",
				action === "delete" ? "border-destructive/50" : "border-primary/50",
			)}
		>
			<div className="px-4 py-3 bg-muted/30 flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<div className={cn("p-1.5 rounded-md", action === "delete" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
						<HugeiconsIcon icon={action === "delete" ? Delete02Icon : PencilEdit02Icon} className="size-4" />
					</div>
					<span className="font-semibold text-sm">{t("actionSelector.title")}</span>
				</div>
				<div className="flex items-center p-1 bg-muted/50 rounded-lg border shadow-sm">
					<button
						type="button"
						onClick={() => onActionChange("update")}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
							action === "update"
								? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
								: "text-muted-foreground hover:text-foreground hover:bg-background/50",
						)}
					>
						<HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
						{t("actionSelector.update")}
					</button>
					<button
						type="button"
						onClick={() => onActionChange("delete")}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
							action === "delete"
								? "bg-destructive/10 text-destructive shadow-sm ring-1 ring-destructive/20"
								: "text-muted-foreground hover:text-destructive hover:bg-destructive/5",
						)}
					>
						<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
						{t("actionSelector.delete")}
					</button>
				</div>
			</div>
		</div>
	);
}
