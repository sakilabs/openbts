import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackendUnavailableError, RateLimitError } from "./api";

function onRateLimitError(error: Error): void {
  if (error instanceof RateLimitError) toast.error(error.message);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onRateLimitError }),
  mutationCache: new MutationCache({ onError: onRateLimitError }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof BackendUnavailableError) return false;
        if (error instanceof RateLimitError) return false;
        return failureCount < 3;
      },
      throwOnError: (error) => error instanceof BackendUnavailableError,
    },
  },
});
