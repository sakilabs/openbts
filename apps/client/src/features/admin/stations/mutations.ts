import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchStation, patchCell, createCells, deleteCell, createLocation, createStation, deleteStation } from "./api";
import type { Station, Cell } from "@/types/station";
import type { CellDraftBase } from "@/features/admin/cells/cellEditRow";
import { shallowEqual } from "@/lib/shallowEqual";

type LocalCell = CellDraftBase & {
  _serverId?: number;
};

export function useCreateLocationMutation() {
  return useMutation({
    mutationFn: createLocation,
  });
}

export function useDeleteStationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stationId: number) => deleteStation(stationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stations"] });
    },
  });
}

export function useCreateStationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stations"] });
    },
  });
}

export function usePatchStationMutation(stationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => patchStation(stationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "station", String(stationId)] });
    },
  });
}

export function useDeleteCellMutation(stationId: number) {
  return useMutation({
    mutationFn: (cellId: number) => deleteCell(stationId, cellId),
  });
}

export function usePatchCellMutation(stationId: number) {
  return useMutation({
    mutationFn: ({ cellId, body }: { cellId: number; body: Record<string, unknown> }) => patchCell(stationId, cellId, body),
  });
}

export function useCreateCellsMutation(stationId: number) {
  return useMutation({
    mutationFn: (cellsData: Record<string, unknown>[]) => createCells(stationId, cellsData),
  });
}

function isCellModified(lc: LocalCell, originalCells: Cell[]): boolean {
  if (!lc._serverId) return false;
  const orig = originalCells.find((c) => c.id === lc._serverId);
  if (!orig) return false;
  return (
    lc.band_id !== orig.band.id ||
    lc.notes !== (orig.notes ?? "") ||
    lc.is_confirmed !== orig.is_confirmed ||
    !shallowEqual(lc.details, orig.details ?? {})
  );
}

export interface SaveStationPayload {
  isCreateMode: boolean;
  stationId: string;
  operatorId: number | null;
  notes: string;
  isConfirmed: boolean;
  location: {
    region_id: number | null;
    city?: string;
    address?: string;
    longitude: number | null;
    latitude: number | null;
  };
  localCells: LocalCell[];
  deletedServerCellIds: number[];
  originalStation?: Station;
}

export function useSaveStationMutation() {
  const queryClient = useQueryClient();
  const createLocationMutation = useCreateLocationMutation();
  const createStationMutation = useCreateStationMutation();

  return useMutation({
    mutationFn: async (payload: SaveStationPayload) => {
      if (payload.isCreateMode) {
        if (!payload.location.region_id || payload.location.longitude === null || payload.location.latitude === null) {
          throw new Error("Location required");
        }

        const locationRes = await createLocationMutation.mutateAsync({
          region_id: payload.location.region_id,
          city: payload.location.city || undefined,
          address: payload.location.address || undefined,
          longitude: payload.location.longitude,
          latitude: payload.location.latitude,
        });

        const cellsPayload = payload.localCells.map((lc) => ({
          station_id: 0,
          band_id: lc.band_id,
          rat: lc.rat,
          is_confirmed: lc.is_confirmed,
          notes: lc.notes || null,
          details: Object.keys(lc.details).length > 0 ? lc.details : undefined,
        }));

        const res = await createStationMutation.mutateAsync({
          station_id: payload.stationId,
          operator_id: payload.operatorId,
          location_id: locationRes.data.id,
          notes: payload.notes || null,
          is_confirmed: payload.isConfirmed,
          cells: cellsPayload,
        });

        return { mode: "create" as const, station: res.data };
      }

      if (!payload.originalStation) {
        throw new Error("Original station required for update");
      }

      const station = payload.originalStation;
      const originalCells = station.cells;

      await patchStation(station.id, {
        station_id: payload.stationId,
        operator_id: payload.operatorId,
        notes: payload.notes || null,
        is_confirmed: payload.isConfirmed,
      });

      if (payload.deletedServerCellIds.length > 0) {
        await Promise.all(payload.deletedServerCellIds.map((cellId) => deleteCell(station.id, cellId)));
      }

      const modifiedCells = payload.localCells.filter((lc) => lc._serverId && isCellModified(lc, originalCells));
      if (modifiedCells.length > 0) {
        await Promise.all(
          modifiedCells.map((lc) =>
            patchCell(station.id, lc._serverId as number, {
              band_id: lc.band_id,
              notes: lc.notes || null,
              is_confirmed: lc.is_confirmed,
              details: lc.details,
            }),
          ),
        );
      }

      const newCells = payload.localCells.filter((lc) => !lc._serverId);
      if (newCells.length > 0) {
        await createCells(
          station.id,
          newCells.map((lc) => ({
            station_id: station.id,
            band_id: lc.band_id,
            rat: lc.rat,
            is_confirmed: lc.is_confirmed,
            notes: lc.notes || null,
            details: lc.details,
          })),
        );
      }

      return { mode: "update" as const, stationId: station.id };
    },
    onSuccess: (result) => {
      if (result.mode === "update") {
        queryClient.invalidateQueries({ queryKey: ["admin", "station", String(result.stationId)] });
      }
    },
  });
}
