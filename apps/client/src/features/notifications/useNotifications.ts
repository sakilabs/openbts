import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllRead as apiMarkAllRead, markRead as apiMarkRead } from "./api";
import { authClient } from "@/lib/authClient";

export function useNotifications() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({ limit: 20, offset: 0 }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    enabled: !!session?.user,
  });

  const markAllMutation = useMutation({
    mutationFn: apiMarkAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markReadMutation = useMutation({
    mutationFn: apiMarkRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: query.data?.data ?? [],
    totalUnread: query.data?.totalUnread ?? 0,
    isLoading: query.isLoading,
    markAllRead: () => markAllMutation.mutate(),
    markRead: (id: string) => markReadMutation.mutate(id),
  };
}
