import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { fetchListByUuid } from "../api";
import type { UserListDetail } from "../api";

export function useListDetail(uuid: string, azimuths?: boolean): UseQueryResult<UserListDetail> {
  return useQuery({
    queryKey: ["list", uuid, { azimuths }],
    queryFn: () => fetchListByUuid(uuid, azimuths),
    enabled: !!uuid,
  });
}
