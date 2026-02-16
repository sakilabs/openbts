import { useState, useMemo, useCallback } from "react";
import { useCellDrafts } from "@/features/admin/cells/hooks/useCellDrafts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchApiData } from "@/lib/api";
import type { ProposedLocationForm } from "@/features/submissions/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Station, Cell, Band, UkeStation } from "@/types/station";
import { RAT_ORDER } from "@/features/admin/cells/rat";
import type { CellDraftBase } from "@/features/admin/cells/cellEditRow";
import { CellsEditor } from "@/features/admin/cells/cellsEditor";
import type { DiffBadges } from "@/features/admin/cells/cellsEditor";
import { operatorsQueryOptions, bandsQueryOptions } from "@/features/admin/queries";
import { useSaveStationMutation } from "@/features/admin/stations/mutations";
import { shallowEqual } from "@/lib/shallowEqual";
import { StationDetailHeader } from "@/features/admin/stations/components/stationDetailHeader";
import { StationInfoForm } from "@/features/admin/stations/components/stationInfoForm";
import { StationCommentsSection } from "@/features/admin/stations/components/stationCommentsSection";
import { useSettings } from "@/hooks/useSettings";

type LocalCell = CellDraftBase & {
  _serverId?: number;
};

function cellToLocal(cell: Cell): LocalCell {
  return {
    _localId: crypto.randomUUID(),
    _serverId: cell.id,
    rat: cell.rat as (typeof RAT_ORDER)[number],
    band_id: cell.band.id,
    is_confirmed: cell.is_confirmed,
    notes: cell.notes ?? "",
    details: { ...(cell.details ?? {}) },
  };
}

type CellDiffStatus = "added" | "modified" | "unchanged";

function getLocalCellDiffStatus(lc: LocalCell, originalCells: Cell[]): CellDiffStatus {
  if (!lc._serverId) return "added";
  const orig = originalCells.find((c) => c.id === lc._serverId);
  if (!orig) return "added";
  if (
    lc.band_id !== orig.band.id ||
    lc.notes !== (orig.notes ?? "") ||
    lc.is_confirmed !== orig.is_confirmed ||
    !shallowEqual(lc.details, orig.details ?? {})
  )
    return "modified";
  return "unchanged";
}

function getDiffBorderClass(status: CellDiffStatus): string | undefined {
  if (status === "added") return "border-l-2 border-l-green-500";
  if (status === "modified") return "border-l-2 border-l-amber-500";
  return undefined;
}

function AdminStationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const isCreateMode = id === "new";

  const { data: station, isLoading } = useQuery({
    queryKey: ["admin", "station", id],
    queryFn: () => fetchApiData<Station>(`stations/${id}`),
    enabled: !!id && !isCreateMode,
  });

  const { t } = useTranslation("admin");

  if (!isCreateMode && isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b bg-background px-4 py-2.5 flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-7 w-40 rounded-md" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:flex-2">
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
            <div className="w-full lg:flex-3 space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCreateMode && !station) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t("common:error.description")}</p>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/stations" })}>
            {t("common:actions.back")}
          </Button>
        </div>
      </div>
    );
  }

  return <StationDetailForm key={station?.id ?? "new"} station={station} isCreateMode={isCreateMode} />;
}

function StationDetailForm({ station, isCreateMode }: { station: Station | undefined; isCreateMode: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation("stations");

  const [stationId, setStationId] = useState(station?.station_id ?? "");
  const [operatorId, setOperatorId] = useState<number | null>(station?.operator_id ?? null);
  const [notes, setNotes] = useState(station?.notes ?? "");
  const [isConfirmed, setIsConfirmed] = useState(station?.is_confirmed ?? false);
  const [location, setLocation] = useState<ProposedLocationForm>(() => ({
    region_id: station?.location.region?.id ?? null,
    city: station?.location.city ?? "",
    address: station?.location.address ?? "",
    longitude: station?.location.longitude ?? null,
    latitude: station?.location.latitude ?? null,
  }));

  const [deletedServerCellIds, setDeletedServerCellIds] = useState<number[]>([]);

  const { data: settings } = useSettings();
  const { data: operators = [] } = useQuery(operatorsQueryOptions());
  const { data: allBands = [] } = useQuery(bandsQueryOptions());

  const saveMutation = useSaveStationMutation();

  const handleServerCellDelete = useCallback((cell: LocalCell) => {
    if (cell._serverId) setDeletedServerCellIds((ids) => [...ids, cell._serverId as number]);
  }, []);

  const createNewStationCell = useCallback(
    (rat: string, defaultBand: Band): LocalCell => ({
      _localId: crypto.randomUUID(),
      rat: rat as (typeof RAT_ORDER)[number],
      band_id: defaultBand.id,
      is_confirmed: false,
      notes: "",
      details: {},
    }),
    [],
  );

  const {
    cells: localCells,
    setCells: setLocalCells,
    cellsByRat,
    enabledRats,
    setEnabledRats,
    visibleRats,
    toggleRat: handleToggleRat,
    changeCell: handleCellChange,
    addCell: handleAddCell,
    deleteCell: handleDeleteCell,
  } = useCellDrafts<LocalCell>({
    initialCells: station?.cells.map(cellToLocal) ?? [],
    allBands,
    createNewCell: createNewStationCell,
    onDelete: handleServerCellDelete,
  });

  const handleLocationChange = useCallback((patch: Partial<ProposedLocationForm>) => {
    setLocation((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleUkeStationSelect = useCallback(
    (ukeStation: UkeStation) => {
      setStationId(ukeStation.station_id);
      setOperatorId(ukeStation.operator?.id ?? null);

      if (ukeStation.location) {
        setLocation({
          latitude: ukeStation.location.latitude,
          longitude: ukeStation.location.longitude,
          city: ukeStation.location.city ?? "",
          address: ukeStation.location.address ?? "",
          region_id: ukeStation.location.region?.id ?? null,
        });
      }

      const seen = new Set<string>();
      const newCells: LocalCell[] = [];
      for (const permit of ukeStation.permits) {
        if (!permit.band || permit.band.rat === "IOT") continue;
        const key = `${permit.band.rat}-${permit.band.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        newCells.push({
          _localId: crypto.randomUUID(),
          rat: permit.band.rat as (typeof RAT_ORDER)[number],
          band_id: permit.band.id,
          is_confirmed: false,
          notes: "",
          details: {},
        });
      }
      newCells.sort((a, b) => RAT_ORDER.indexOf(a.rat) - RAT_ORDER.indexOf(b.rat));
      setLocalCells(newCells);
      setEnabledRats([...new Set(newCells.map((c) => c.rat))]);
      setDeletedServerCellIds([]);
    },
    [setLocalCells, setEnabledRats],
  );

  const handleSaveStation = () => {
    if (isCreateMode) {
      if (!stationId.trim()) {
        toast.error(t("toast.stationIdRquired"));
        return;
      }
      if (!operatorId) {
        toast.error(t("toast.operatorRequired"));
        return;
      }
      if (location.longitude === null || location.latitude === null || location.region_id === null) {
        toast.error(t("toast.locationRequired"));
        return;
      }
    }

    saveMutation.mutate(
      {
        isCreateMode,
        stationId,
        operatorId,
        notes,
        isConfirmed,
        location,
        localCells,
        deletedServerCellIds,
        originalStation: station,
      },
      {
        onSuccess: (result) => {
          if (result.mode === "create") {
            toast.success(t("toast.created"));
            navigate({ to: `/admin/stations/${result.station.id}`, replace: true });
          } else {
            toast.success(t("toast.cellsSaved"));
            setDeletedServerCellIds([]);
          }
        },
        onError: (_error) => {
          toast.error(t("common:error.toast"));
        },
      },
    );
  };

  const handleRevert = () => {
    if (isCreateMode) {
      setStationId("");
      setOperatorId(null);
      setNotes("");
      setIsConfirmed(false);
      setEnabledRats([]);
      setLocation({ region_id: null, city: "", address: "", longitude: null, latitude: null });
      setLocalCells([]);
      setDeletedServerCellIds([]);
      return;
    }
    if (!station) return;
    setStationId(station.station_id);
    setOperatorId(station.operator_id);
    setNotes(station.notes ?? "");
    setIsConfirmed(station.is_confirmed);
    const existingRats = [...new Set(station.cells.map((c) => c.rat))];
    setEnabledRats(RAT_ORDER.filter((r) => existingRats.includes(r)));
    setLocation({
      region_id: station.location.region?.id ?? null,
      city: station.location.city ?? "",
      address: station.location.address ?? "",
      longitude: station.location.longitude,
      latitude: station.location.latitude,
    });
    setLocalCells(station.cells.map(cellToLocal));
    setDeletedServerCellIds([]);
  };

  const selectedOperator = useMemo(() => operators.find((o) => o.id === operatorId), [operators, operatorId]);

  const originalCells = station?.cells ?? [];

  const getStationDiffBadges = useCallback(
    (rat: string, cellsForRat: LocalCell[]): DiffBadges => {
      let added = 0;
      let modified = 0;
      for (const lc of cellsForRat) {
        const status = getLocalCellDiffStatus(lc, originalCells);
        if (status === "added") added++;
        else if (status === "modified") modified++;
      }
      const deleted = originalCells.filter((c) => c.rat === rat && deletedServerCellIds.includes(c.id)).length;
      return { added, modified, deleted };
    },
    [originalCells, deletedServerCellIds],
  );

  const getStationCellProps = useCallback(
    (cell: LocalCell) => {
      const diffStatus = getLocalCellDiffStatus(cell, originalCells);
      return {
        leftBorderClass: getDiffBorderClass(diffStatus),
      };
    },
    [originalCells],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <StationDetailHeader
        station={station}
        stationId={stationId}
        isCreateMode={isCreateMode}
        selectedOperator={selectedOperator}
        isSaving={saveMutation.isPending}
        onSave={handleSaveStation}
        onRevert={handleRevert}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-3 p-3">
          <div className="w-full lg:flex-2 space-y-2">
            <StationInfoForm
              stationId={stationId}
              onStationIdChange={setStationId}
              operatorId={operatorId}
              onOperatorIdChange={setOperatorId}
              notes={notes}
              onNotesChange={setNotes}
              isConfirmed={isConfirmed}
              onIsConfirmedChange={setIsConfirmed}
              location={location}
              onLocationChange={handleLocationChange}
              operators={operators}
              selectedOperator={selectedOperator}
              onUkeStationSelect={handleUkeStationSelect}
            />

            {!isCreateMode && station && settings?.enableStationComments && <StationCommentsSection stationId={station.id} />}
          </div>

          <div className="w-full lg:flex-3 min-w-0 space-y-2">
            <CellsEditor
              cellsByRat={cellsByRat}
              enabledRats={enabledRats}
              visibleRats={visibleRats}
              bands={allBands}
              onToggleRat={handleToggleRat}
              onCellChange={handleCellChange}
              onAddCell={handleAddCell}
              onDeleteCell={handleDeleteCell}
              getDiffBadges={getStationDiffBadges}
              getCellProps={getStationCellProps}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/stations/$id")({
  component: AdminStationDetailPage,
  staticData: {
    titleKey: "breadcrumbs.editStation",
    i18nNamespace: "admin",
    breadcrumbs: [
      { titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" },
      { titleKey: "breadcrumbs.stations", path: "/admin/stations", i18nNamespace: "admin" },
    ],
  },
});
