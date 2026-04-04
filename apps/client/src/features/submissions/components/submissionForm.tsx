import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";

import { StationSelector } from "./stationSelector";
import { LocationPicker } from "./locationPicker";
import { NewStationForm } from "./newStationForm";
import { RatSelector } from "./ratSelector";
import { ActionSelector } from "./actionSelector";
import { SubmitSection } from "./submitSection";
import { CellsSection } from "./cellsSection";
import { ExtraIdentificatorsSection } from "./extraIdentificatorsSection";
import { PhotoUploadSection } from "./photoUploadSection";
import { SubmissionLocationPhotoSelector } from "./submissionLocationPhotoSelector";
import { useSubmissionForm } from "./useSubmissionForm";
import { useSettings } from "@/hooks/useSettings";

export interface SubmissionFormProps {
  preloadStationId?: number;
  editSubmissionId?: string;
  preloadUkeStationId?: string;
}

export function SubmissionForm({ preloadStationId, editSubmissionId, preloadUkeStationId }: SubmissionFormProps) {
  const { t } = useTranslation(["submissions", "common"]);
  const { data: settings } = useSettings();
  const {
    form,
    mutation,
    isEditMode,
    cellErrors,
    formErrors,
    computeHasChanges,
    photos,
    setPhotos,
    photoNotes,
    setPhotoNotes,
    photoTakenAts,
    setPhotoTakenAts,
    locationPhotoIds,
    setLocationPhotoIds,
    handlers: {
      handleModeChange,
      handleActionChange,
      loadStation,
      handleUkeStationSelect,
      handleRatsChange,
      handleCellsChange,
      handleLocationChange,
      handleNewStationChange,
      handleSubmitterNoteChange,
      handleNetworksIdChange,
      handleNetworksNameChange,
      handleMnoNameChange,
    },
  } = useSubmissionForm({ preloadStationId, editSubmissionId, preloadUkeStationId });

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tagName = target.tagName;
    if (tagName === "INPUT" || tagName === "SELECT") e.preventDefault();
  }

  return (
    <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown} className="flex flex-wrap gap-4 h-full">
      <div className="flex-[2_1_300px] space-y-3 max-w-136">
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

            return (
              <LocationPicker
                location={location}
                errors={formErrors.location}
                onLocationChange={handleLocationChange}
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

            return <NewStationForm station={newStation} errors={formErrors.station} onStationChange={handleNewStationChange} />;
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
            return (
              <ExtraIdentificatorsSection
                selectedStation={selectedStation}
                networksId={networksId}
                networksName={networksName}
                mnoName={mnoName}
                onNetworksIdChange={handleNetworksIdChange}
                onNetworksNameChange={handleNetworksNameChange}
                onMnoNameChange={handleMnoNameChange}
              />
            );
          }}
        </form.Subscribe>

        {settings?.photosEnabled && (
          <form.Subscribe
            selector={(s) => ({
              mode: s.values.mode,
              selectedStation: s.values.selectedStation,
              location: s.values.location,
              action: s.values.action,
            })}
          >
            {({ mode, selectedStation, location, action }) => {
              if (action === "delete") return null;

              if (mode === "existing" && selectedStation) {
                const locationId = selectedStation.location?.id;
                return (
                  <>
                    {locationId !== undefined ? (
                      <SubmissionLocationPhotoSelector
                        stationId={selectedStation.id}
                        locationId={locationId}
                        selectedIds={locationPhotoIds}
                        onSelectionChange={setLocationPhotoIds}
                      />
                    ) : null}
                    <PhotoUploadSection
                      photos={photos}
                      onPhotosChange={setPhotos}
                      notes={photoNotes}
                      onNotesChange={setPhotoNotes}
                      takenAts={photoTakenAts}
                      onTakenAtsChange={setPhotoTakenAts}
                      editSubmissionId={editSubmissionId}
                    />
                  </>
                );
              }

              const showForNew = mode === "new" && location.latitude !== null && location.longitude !== null;
              if (!showForNew) return null;
              return (
                <PhotoUploadSection
                  photos={photos}
                  onPhotosChange={setPhotos}
                  notes={photoNotes}
                  onNotesChange={setPhotoNotes}
                  takenAts={photoTakenAts}
                  onTakenAtsChange={setPhotoTakenAts}
                  editSubmissionId={editSubmissionId}
                />
              );
            }}
          </form.Subscribe>
        )}

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
            submitterNote: s.values.submitterNote,
            networksId: s.values.networksId,
            networksName: s.values.networksName,
            mnoName: s.values.mnoName,
            selectedRats: s.values.selectedRats,
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
            selectedRats,
            canSubmit,
            isSubmitting,
          }) => {
            const hasChanges = computeHasChanges(mode, action, newStation, location, cells, submitterNote, networksId, networksName, mnoName);
            const cellsCount = cells.filter((c) => selectedRats.includes(c.rat)).length;
            return (
              <SubmitSection
                mode={mode}
                action={action}
                selectedStation={selectedStation}
                newStation={newStation}
                cellsCount={cellsCount}
                submitterNote={submitterNote}
                onSubmitterNoteChange={handleSubmitterNoteChange}
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

      <div className="flex-[3_1_500px] min-w-0">
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

            return (
              <CellsSection
                selectedRats={selectedRats}
                cells={cells}
                originalCells={originalCells}
                isNewStation={mode === "new"}
                cellErrors={cellErrors}
                onCellsChange={handleCellsChange}
              />
            );
          }}
        </form.Subscribe>
      </div>
    </form>
  );
}
