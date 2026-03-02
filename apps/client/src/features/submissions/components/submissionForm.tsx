import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Tick02Icon, PencilEdit02Icon, Delete02Icon, Globe02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StationSelector } from "./stationSelector";
import { LocationPicker } from "./locationPicker";
import { NewStationForm } from "./newStationForm";
import { RatSelector } from "./ratSelector";
import { CellDetailsForm } from "./cellDetailsForm";
import { createSubmission, updateSubmission, fetchSubmissionForEdit, fetchStationForSubmission, type SearchStation } from "../api";
import { fetchUkePermitsByStationId } from "@/features/map/api";
import { showApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { generateCellId, computeCellPayloads, cellsToPayloads, ukePermitsToCells } from "../utils/cells";
import { validateForm, validateCells, hasErrors, type FormErrors, type CellError } from "../utils/validation";
import { hasFormChanges, type OriginalState } from "../utils/equality";
import type { SubmissionMode, StationAction, ProposedStationForm, ProposedLocationForm, ProposedCellForm, RatType } from "../types";
import { EXTRA_IDENTIFICATORS_MNCS, MNO_NAME_ONLY_MNCS } from "@/lib/operatorUtils";
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
  networksId: number | null;
  networksName: string;
  mnoName: string;
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
  networksId: null,
  networksName: "",
  mnoName: "",
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
  preloadUkeStationId?: string;
};

export function SubmissionForm({ preloadStationId, editSubmissionId, preloadUkeStationId }: SubmissionFormProps) {
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
    queryFn: () => {
      if (!editSubmissionId) throw new Error("editSubmissionId is required");
      return fetchSubmissionForEdit(editSubmissionId);
    },
    enabled: isEditMode,
    staleTime: 1000 * 60 * 5,
  });

  const [originalState, setOriginalState] = useState<OriginalState>({});

  const computeHasChanges = useCallback(
    (
      mode: SubmissionMode,
      action: StationAction,
      newStation: ProposedStationForm,
      location: ProposedLocationForm,
      cells: ProposedCellForm[],
      submitterNote: string,
      networksId: number | null,
      networksName: string | null,
      mnoName: string | null,
    ): boolean => {
      if (hasFormChanges({ mode, action, newStation, location, cells, submitterNote }, originalState, isEditMode)) return true;
      if (mode === "existing") {
        if (networksId !== (originalState.networksId ?? null)) return true;
        if (networksId !== null && networksName !== (originalState.networksName ?? "")) return true;
        if (mnoName !== (originalState.mnoName ?? "")) return true;
      }
      return false;
    },
    [originalState, isEditMode],
  );

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

      const hadExtraIds = (originalState.networksId !== null && originalState.networksId !== undefined) || !!originalState.mnoName;
      const existingStation =
        !isNewStation && !isDeleteMode && (value.networksId !== null || value.networksName || value.mnoName || hadExtraIds)
          ? {
              station_id: value.selectedStation!.station_id,
              operator_id: value.selectedStation!.operator_id,
              networks_id: value.networksId,
              networks_name: value.networksName || null,
              mno_name: value.mnoName || null,
            }
          : undefined;

      await mutation.mutateAsync({
        station_id: isNewStation ? null : (value.selectedStation?.id ?? null),
        type: submissionType,
        submitter_note: value.submitterNote || undefined,
        station: isNewStation ? value.newStation : existingStation,
        location: hasLocation && !isDeleteMode ? value.location : undefined,
        cells: isDeleteMode ? [] : cells,
      });
    },
  });

  const mutation = useMutation({
    mutationFn: isEditMode
      ? (data: Parameters<typeof updateSubmission>[1]) => {
          if (!editSubmissionId) throw new Error("editSubmissionId is required for updateSubmission");
          return updateSubmission(editSubmissionId, data);
        }
      : createSubmission,
    onSuccess: () => {
      toast.success(t(isEditMode ? "toast.updated" : "toast.submitted"));
      if (isEditMode) {
        void queryClient.invalidateQueries({ queryKey: ["submission-edit", editSubmissionId] });
      } else {
        form.reset();
      }
      setShowErrors(false);
    },
    onError: (error) => {
      showApiError(error);
    },
  });

  const handleModeChange = (newMode: SubmissionMode) => {
    form.setFieldValue("mode", newMode);
    form.setFieldValue("action", "update");
    form.setFieldValue("location", INITIAL_VALUES.location);
    form.setFieldValue("submitterNote", "");
    form.setFieldValue("networksId", null);
    form.setFieldValue("networksName", "");
    form.setFieldValue("mnoName", "");
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

        const networksId = station.extra_identificators?.networks_id ?? null;
        const networksName = station.extra_identificators?.networks_name ?? "";
        const mnoName = station.extra_identificators?.mno_name ?? "";
        form.setFieldValue("networksId", networksId);
        form.setFieldValue("networksName", networksName);
        form.setFieldValue("mnoName", mnoName);

        if (station.location) {
          const location = {
            latitude: station.location.latitude,
            longitude: station.location.longitude,
            city: station.location.city ?? "",
            address: station.location.address ?? "",
            region_id: station.location.region?.id ?? null,
          };
          form.setFieldValue("location", location);
          setOriginalState({ location, cells: structuredClone(cells), networksId, networksName, mnoName });
        } else {
          setOriginalState({ cells: structuredClone(cells), networksId, networksName, mnoName });
        }
      } else {
        form.setFieldValue("cells", []);
        form.setFieldValue("originalCells", []);
        form.setFieldValue("selectedRats", []);
        form.setFieldValue("location", INITIAL_VALUES.location);
        form.setFieldValue("networksId", null);
        form.setFieldValue("networksName", "");
        form.setFieldValue("mnoName", "");
        setOriginalState({});
      }
    },
    [form],
  );

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

  const { data: preloadUkePermits } = useQuery({
    queryKey: ["uke-permits-preload", preloadUkeStationId],
    queryFn: () => fetchUkePermitsByStationId(preloadUkeStationId!),
    enabled: !!preloadUkeStationId && !isEditMode,
    staleTime: 1000 * 60 * 5,
  });

  const hasAppliedUkePreload = useRef(false);

  useEffect(() => {
    if (!preloadUkePermits?.length || hasAppliedUkePreload.current) return;
    hasAppliedUkePreload.current = true;
    const first = preloadUkePermits[0];
    handleUkeStationSelect({
      station_id: preloadUkeStationId!,
      operator: first.operator ?? null,
      location: first.location ?? null,
      permits: preloadUkePermits,
    });
  }, [preloadUkePermits, preloadUkeStationId, handleUkeStationSelect]);

  const lastAppliedStationId = useRef<number | null>(null);

  // Sync form state when preloaded station data arrives from query
  useEffect(() => {
    if (preloadedStation) {
      if (preloadedStation.id !== lastAppliedStationId.current) {
        lastAppliedStationId.current = preloadedStation.id;
        const station = preloadedStation;
        queueMicrotask(() => {
          form.setFieldValue("mode", "existing");
          form.setFieldValue("newStation", INITIAL_VALUES.newStation);
          loadStation(station);
        });
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
    const submission = editSubmission;

    const isNew = submission.type === "new";
    const proposedCells: ProposedCellForm[] = submission.cells.map((cell) => ({
      id: generateCellId(),
      existingCellId: cell.target_cell_id ?? undefined,
      rat: cell.rat as RatType,
      band_id: cell.band_id,
      notes: cell.notes ?? undefined,
      is_confirmed: cell.is_confirmed,
      details: cell.details ?? {},
    }));

    const deletedTargetIds = new Set(
      submission.cells.filter((c) => c.operation === "delete" && c.target_cell_id !== null).map((c) => c.target_cell_id),
    );
    const updatedTargetIds = new Set(
      submission.cells.filter((c) => c.operation === "update" && c.target_cell_id !== null).map((c) => c.target_cell_id),
    );

    queueMicrotask(() => {
      form.setFieldValue("mode", isNew ? "new" : "existing");
      form.setFieldValue("action", submission.type === "delete" ? "delete" : "update");
      form.setFieldValue("submitterNote", submission.submitter_note ?? "");

      if (isNew && submission.proposedStation) {
        form.setFieldValue("newStation", {
          station_id: submission.proposedStation.station_id ?? "",
          operator_id: submission.proposedStation.operator_id,
          notes: submission.proposedStation.notes ?? "",
          networks_id: submission.proposedStation.networks_id ?? undefined,
          networks_name: submission.proposedStation.networks_name ?? undefined,
          mno_name: submission.proposedStation.mno_name ?? undefined,
        });
      }

      if (!isNew && submission.proposedStation) {
        if (submission.proposedStation.networks_id) {
          form.setFieldValue("networksId", submission.proposedStation.networks_id);
          form.setFieldValue("networksName", submission.proposedStation.networks_name ?? "");
        }

        if (submission.proposedStation.mno_name) form.setFieldValue("mnoName", submission.proposedStation.mno_name);
      }

      if (submission.proposedLocation) {
        form.setFieldValue("location", {
          region_id: submission.proposedLocation.region_id,
          city: submission.proposedLocation.city ?? "",
          address: submission.proposedLocation.address ?? "",
          longitude: submission.proposedLocation.longitude,
          latitude: submission.proposedLocation.latitude,
        });
      }

      if (!isNew && submission.station) {
        void fetchStationForSubmission(submission.station.id).then((station) => {
          if (ignore) return;
          form.setFieldValue("selectedStation", station);
          const originals = stationCellsToForm(station);
          form.setFieldValue("originalCells", originals);

          const unchangedCells = originals.filter(
            (c) => c.existingCellId !== undefined && !updatedTargetIds.has(c.existingCellId) && !deletedTargetIds.has(c.existingCellId),
          );
          const changedCells = proposedCells.filter((c) => c.existingCellId === undefined || updatedTargetIds.has(c.existingCellId));
          const mergedCells = [...unchangedCells, ...changedCells];

          form.setFieldValue("cells", mergedCells);
          form.setFieldValue("selectedRats", [...new Set(mergedCells.map((c) => c.rat))]);

          if (station.location && !submission.proposedLocation) {
            form.setFieldValue("location", {
              latitude: station.location.latitude,
              longitude: station.location.longitude,
              city: station.location.city ?? "",
              address: station.location.address ?? "",
              region_id: station.location.region?.id ?? null,
            });
          }
        });
      } else {
        form.setFieldValue("cells", proposedCells);
        if (isNew) form.setFieldValue("originalCells", []);
        form.setFieldValue("selectedRats", [...new Set(proposedCells.map((c) => c.rat))]);
      }
    });

    return () => {
      ignore = true;
    };
  }, [editSubmission, form]);

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
        void form.handleSubmit();
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
      <div className="w-full lg:flex-2 space-y-3 max-w-136">
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
            <StationSelector mode={mode} selectedStation={selectedStation} onModeChange={handleModeChange} onStationSelect={loadStation} />
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
            networksId: s.values.networksId,
            networksName: s.values.networksName,
            mnoName: s.values.mnoName,
          })}
        >
          {({ mode, action, selectedStation, networksId, networksName, mnoName }) => {
            if (mode !== "existing" || !selectedStation || action === "delete") return null;
            const operatorMnc = selectedStation.operator?.mnc;
            const showExtraIdFields = !!operatorMnc && EXTRA_IDENTIFICATORS_MNCS.includes(operatorMnc);
            const showMnoNameOnly = !!operatorMnc && MNO_NAME_ONLY_MNCS.includes(operatorMnc);
            if (!showExtraIdFields && !showMnoNameOnly) return null;

            return (
              <div className="border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
                  <HugeiconsIcon icon={Globe02Icon} className="size-4 text-primary" />
                  <span className="font-semibold text-sm">Extra Identificators</span>
                </div>
                <div className="p-4 space-y-3">
                  {showExtraIdFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="existing_networks_id" className="text-xs">
                          {t("common:labels.networksId", "N! ID")}
                        </Label>
                        <Input
                          id="existing_networks_id"
                          type="number"
                          placeholder="e.g. 12345"
                          value={networksId ?? ""}
                          onChange={(e) => form.setFieldValue("networksId", e.target.value ? Number(e.target.value) : null)}
                          className="h-8 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="existing_networks_name" className="text-xs">
                          {t("common:labels.networksName", "MNO name")}
                        </Label>
                        <Input
                          id="existing_networks_name"
                          placeholder={t("common:placeholder.optional", "Optional")}
                          value={networksName}
                          maxLength={50}
                          onChange={(e) => form.setFieldValue("networksName", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="existing_mno_name" className="text-xs">
                      {t("common:labels.mnoName", "MNO name")}
                    </Label>
                    <Input
                      id="existing_mno_name"
                      placeholder={t("common:placeholder.optional", "Optional")}
                      value={mnoName}
                      maxLength={50}
                      onChange={(e) => form.setFieldValue("mnoName", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            );
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
            location: s.values.location,
            cells: s.values.cells,
            cellsCount: s.values.cells.filter((c) => s.values.selectedRats.includes(c.rat)).length,
            submitterNote: s.values.submitterNote,
            networksId: s.values.networksId,
            networksName: s.values.networksName,
            mnoName: s.values.mnoName,
            canSubmit: s.canSubmit,
            isSubmitting: s.isSubmitting,
          })}
        >
          {({
            mode,
            action,
            selectedStation,
            newStation,
            location,
            cells,
            submitterNote,
            networksId,
            networksName,
            mnoName,
            canSubmit,
            isSubmitting,
          }) => {
            const hasChanges = computeHasChanges(mode, action, newStation, location, cells, submitterNote, networksId, networksName, mnoName);
            return (
              <SubmitSection
                mode={mode}
                action={action}
                selectedStation={selectedStation}
                newStation={newStation}
                cellsCount={cells.filter((c) => form.getFieldValue("selectedRats").includes(c.rat)).length}
                submitterNote={submitterNote}
                onSubmitterNoteChange={(note) => form.setFieldValue("submitterNote", note)}
                canSubmit={canSubmit && hasChanges}
                isSubmitting={isSubmitting}
                isPending={mutation.isPending}
                isSuccess={mutation.isSuccess}
                isEditMode={isEditMode}
                hasChanges={hasChanges}
              />
            );
          }}
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
  hasChanges: boolean;
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
  hasChanges,
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

  const showNoChangesMessage = !hasChanges && (mode === "new" || selectedStation) && !isDeleteAction;

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 space-y-3">
        {!isDeleteAction && <div className="text-xs text-muted-foreground">{t("form.summary")}</div>}
        {isDeleteAction && <div className="text-xs text-amber-600 dark:text-amber-500">{t("deleteStation.warning")}</div>}
        {showNoChangesMessage && <div className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5">{t("form.noChanges")}</div>}
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
