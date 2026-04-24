import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CellDraftBase } from "@/features/admin/cells/cellEditRow";
import { pickCellDetails } from "@/features/submissions/api";
import { shallowEqual } from "@/lib/shallowEqual";
import type { Cell, Station } from "@/types/station";

import { patchLocation } from "../locations/api";
import { createCells, createLocation, createStation, deleteCell, deleteStation, patchCell, patchCells, patchStation, updateExtraIds } from "./api";

export type LocalCell = CellDraftBase & {
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
      return queryClient.invalidateQueries({ queryKey: ["admin", "stations"] });
    },
  });
}

export function useCreateStationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["admin", "stations"] });
    },
  });
}

export function usePatchStationMutation(stationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => patchStation(stationId, body),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["admin", "station", String(stationId)] });
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

export function isCellModified(lc: LocalCell, originalCells: Cell[]): boolean {
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
  extraAddress: string;
  isConfirmed: boolean;
  location: {
    region_id: number | null;
    city?: string;
    address?: string;
    longitude: number | null;
    latitude: number | null;
  };
  existingLocationId: number | null;
  localCells: LocalCell[];
  deletedServerCellIds: number[];
  originalStation?: Station;
  networksId?: number;
  networksName?: string;
  mnoName?: string;
  skipExtraIds?: boolean;
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

        let locationId: number;
        if (payload.existingLocationId) {
          locationId = payload.existingLocationId;
        } else {
          const locationRes = await createLocationMutation.mutateAsync({
            region_id: payload.location.region_id,
            city: payload.location.city || undefined,
            address: payload.location.address || undefined,
            longitude: payload.location.longitude,
            latitude: payload.location.latitude,
          });
          locationId = locationRes.data.id;
        }

        const cellsPayload = payload.localCells.map((lc) => ({
          station_id: 0,
          band_id: lc.band_id,
          rat: lc.rat,
          is_confirmed: lc.is_confirmed,
          notes: lc.notes || null,
          details: pickCellDetails(lc.rat, lc.details),
        }));

        const res = await createStationMutation.mutateAsync({
          station_id: payload.stationId,
          operator_id: payload.operatorId,
          location_id: locationId,
          notes: payload.notes || null,
          extra_address: payload.extraAddress || null,
          is_confirmed: payload.isConfirmed,
          cells: cellsPayload,
        });

        if (!payload.skipExtraIds && (payload.networksId || payload.networksName || payload.mnoName)) {
          await updateExtraIds(res.data.id, {
            networks_id: payload.networksId ?? null,
            networks_name: payload.networksName || null,
            mno_name: payload.mnoName || null,
          });
        }

        return { mode: "create" as const, station: res.data };
      }

      if (!payload.originalStation) {
        throw new Error("Original station required for update");
      }

      const station = payload.originalStation;
      const originalCells = station.cells;

      const stationPatch: Record<string, unknown> = {
        station_id: payload.stationId,
        operator_id: payload.operatorId,
        notes: payload.notes || null,
        extra_address: payload.extraAddress || null,
        is_confirmed: payload.isConfirmed,
      };

      if (payload.existingLocationId && payload.existingLocationId !== (station.location?.id ?? null)) {
        stationPatch.location_id = payload.existingLocationId;
      } else if (station.location) {
        const locationPatch: Record<string, unknown> = {};
        if (payload.location.latitude !== (station.location.latitude ?? null)) locationPatch.latitude = payload.location.latitude;
        if (payload.location.longitude !== (station.location.longitude ?? null)) locationPatch.longitude = payload.location.longitude;
        if (payload.location.city !== (station.location.city ?? "")) locationPatch.city = payload.location.city || null;
        if (payload.location.address !== (station.location.address ?? "")) locationPatch.address = payload.location.address || null;
        if (payload.location.region_id !== (station.location.region?.id ?? null)) locationPatch.region_id = payload.location.region_id;
        if (Object.keys(locationPatch).length > 0) await patchLocation(station.location.id, locationPatch);
      } else if (payload.location.latitude !== null && payload.location.longitude !== null && payload.location.region_id) {
        const locationRes = await createLocationMutation.mutateAsync({
          region_id: payload.location.region_id,
          city: payload.location.city || undefined,
          address: payload.location.address || undefined,
          longitude: payload.location.longitude,
          latitude: payload.location.latitude,
        });
        stationPatch.location_id = locationRes.data.id;
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
            details: pickCellDetails(lc.rat, lc.details),
          })),
        );
      }

      const modifiedCells = payload.localCells.filter((lc) => lc._serverId && isCellModified(lc, originalCells));
      if (modifiedCells.length > 0) {
        await patchCells(
          station.id,
          modifiedCells.map((lc) => ({
            cell_id: lc._serverId as number,
            band_id: lc.band_id,
            notes: lc.notes || null,
            is_confirmed: lc.is_confirmed,
            details: pickCellDetails(lc.rat, lc.details),
          })),
        );
      }

      if (payload.deletedServerCellIds.length > 0) {
        await Promise.all(payload.deletedServerCellIds.map((cellId) => deleteCell(station.id, cellId)));
      }

      const stationChanged =
        stationPatch.station_id !== station.station_id ||
        stationPatch.operator_id !== (station.operator?.id ?? null) ||
        stationPatch.notes !== (station.notes ?? null) ||
        stationPatch.extra_address !== (station.extra_address ?? null) ||
        stationPatch.is_confirmed !== station.is_confirmed ||
        ("location_id" in stationPatch && stationPatch.location_id !== (station.location?.id ?? null));

      if (stationChanged) await patchStation(station.id, stationPatch);

      const existingNetworksId = payload.originalStation?.extra_identificators?.networks_id ?? null;
      if (payload.skipExtraIds) return { mode: "update" as const, stationId: station.id };

      const extraIdsFieldsChanged =
        (payload.networksId ?? null) !== existingNetworksId ||
        (payload.networksName || null) !== (payload.originalStation?.extra_identificators?.networks_name || null) ||
        (payload.mnoName || null) !== (payload.originalStation?.extra_identificators?.mno_name || null);

      const existingHasExtraIds = existingNetworksId !== null || !!payload.originalStation?.extra_identificators?.mno_name;
      if (((payload.networksId !== null && payload.networksId !== undefined) || !!payload.mnoName || existingHasExtraIds) && extraIdsFieldsChanged) {
        await updateExtraIds(station.id, {
          networks_id: payload.networksId ?? null,
          networks_name: payload.networksName || null,
          mno_name: payload.mnoName || null,
        });
      }

      return { mode: "update" as const, stationId: station.id };
    },
    onSuccess: (result) => {
      if (result.mode === "update") return queryClient.invalidateQueries({ queryKey: ["admin", "station", String(result.stationId)] });
    },
  });
}
