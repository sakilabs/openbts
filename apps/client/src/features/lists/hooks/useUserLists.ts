import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchUserLists } from "../api";

const LIMIT = 50;

export function useUserLists(): UseInfiniteQueryResult<InfiniteData<Awaited<ReturnType<typeof fetchUserLists>>>> {
  return useInfiniteQuery({
    queryKey: ["user-lists"],
    queryFn: ({ pageParam = 1 }) => fetchUserLists(LIMIT, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * LIMIT;
      return fetched < lastPage.totalCount ? allPages.length + 1 : undefined;
    },
  });
}
