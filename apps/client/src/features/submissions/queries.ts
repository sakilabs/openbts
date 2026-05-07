import { useQuery } from "@tanstack/react-query";

import { fetchSubmissionBatch } from "./api";

export const useBatchDetail = (id: string) =>
  useQuery({ queryKey: ["submissionBatches", "details", id], queryFn: () => fetchSubmissionBatch(id), enabled: !!id });
