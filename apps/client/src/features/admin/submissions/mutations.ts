import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, API_BASE } from "@/lib/api";
import type { ProposedLocationForm } from "@/features/submissions/types";
import type { CellDraftBase } from "@/features/admin/cells/cellEditRow";

type LocalCell = CellDraftBase & {
  _serverId?: number;
  operation: "add" | "update" | "delete" | "unchanged";
  target_cell_id: number | null;
};

export interface SaveSubmissionPayload {
  submissionId: string;
  reviewNotes: string;
  stationForm: {
    station_id: string;
    operator_id: number | null;
    notes: string;
  };
  networksForm: {
    networks_id: number | null;
    networks_name: string;
    mno_name: string;
  };
  locationForm: ProposedLocationForm;
  localCells: LocalCell[];
}

export function useSaveSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveSubmissionPayload) => {
      return fetchJson(`${API_BASE}/submissions/${payload.submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_notes: payload.reviewNotes || null,
          station: {
            station_id: payload.stationForm.station_id,
            operator_id: payload.stationForm.operator_id,
            notes: payload.stationForm.notes || null,
            networks_id: payload.networksForm.networks_id,
            networks_name: payload.networksForm.networks_name || null,
            mno_name: payload.networksForm.mno_name || null,
          },
          location: {
            region_id: payload.locationForm.region_id,
            city: payload.locationForm.city || undefined,
            address: payload.locationForm.address || undefined,
            longitude: payload.locationForm.longitude,
            latitude: payload.locationForm.latitude,
          },
          cells: payload.localCells
            .filter((lc) => lc.operation !== "unchanged")
            .map((lc) => ({
              operation: lc.operation,
              target_cell_id: lc.target_cell_id,
              band_id: lc.band_id,
              rat: lc.rat,
              is_confirmed: lc.is_confirmed,
              notes: lc.notes || null,
              details: Object.keys(lc.details).length > 0 ? lc.details : undefined,
            })),
        }),
      });
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submission", payload.submissionId] });
    },
  });
}

export function useApproveSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, reviewNotes }: { submissionId: string; reviewNotes: string }) => {
      return fetchJson(`${API_BASE}/submissions/${submissionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_notes: reviewNotes || null }),
      });
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submission", payload.submissionId] });
    },
  });
}

export function useRejectSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, reviewNotes }: { submissionId: string; reviewNotes: string }) => {
      return fetchJson(`${API_BASE}/submissions/${submissionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_notes: reviewNotes || null }),
      });
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submission", payload.submissionId] });
    },
  });
}
