import { useQuery } from "@tanstack/react-query";

import { type KmzSource, type KmzType, fetchKmzList } from "./api";

export function useKmzList(type: KmzType, source: KmzSource) {
  return useQuery({
    queryKey: ["kmz", type, source],
    queryFn: () => fetchKmzList(type, source),
  });
}
