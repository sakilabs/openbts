import { useQuery } from "@tanstack/react-query";

import { fetchSubmissionForEdit } from "./api";

export const useBatchDetail = (id: string) =>
  useQuery({ queryKey: ["submissionBatches", "details", id], queryFn: () => fetchSubmissionForEdit(id), enabled: !!id });
