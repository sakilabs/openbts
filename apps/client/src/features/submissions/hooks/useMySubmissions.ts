import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { fetchMySubmissions } from "../api";
import type { MySubmissionsResponse } from "../api";

const LIMIT = 20;

export function useMySubmissions(userId?: string): UseInfiniteQueryResult<InfiniteData<MySubmissionsResponse>> {
  return useInfiniteQuery({
    queryKey: ["my-submissions", userId],
    queryFn: ({ pageParam = 0 }) => fetchMySubmissions(LIMIT, pageParam as number, userId),
    initialPageParam: 0,
    enabled: !!userId,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * LIMIT;
      return fetched < lastPage.totalCount ? fetched : undefined;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}
