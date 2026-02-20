import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchLocation, deleteLocation } from "./api";

export function usePatchLocationMutation(locationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => patchLocation(locationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "location", String(locationId)] });
      queryClient.invalidateQueries({ queryKey: ["admin-locations-list"] });
    },
  });
}

export function useDeleteLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationId: number) => deleteLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-locations-list"] });
    },
  });
}
