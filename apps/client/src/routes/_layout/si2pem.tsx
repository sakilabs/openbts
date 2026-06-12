import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { fetchPlannedMeasurements } from "@/features/si2pem/api";
import { MeasurementsDataTable } from "@/features/si2pem/components/measurementsDataTable";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { cn } from "@/lib/utils";

const TABLE_PAGINATION_CONFIG = { rowHeight: 64, headerHeight: 40, paginationHeight: 45 };
type Tab = "PLANNED" | "COMPLETED" | "CANCELED";

function SI2PEMPage() {
  const { t, i18n } = useTranslation("si2pem");
  const { t: tCommon } = useTranslation("common");
  const locale = i18n.language;
  const [tab, setTab] = useState<Tab>("PLANNED");
  const { containerRef, pagination, setPagination, autoPageSize, pageSizeOptions } = useTablePagination(TABLE_PAGINATION_CONFIG);

  const resetPage = useCallback(() => setPagination((prev) => ({ ...prev, pageIndex: 0 })), [setPagination]);
  const { data, isLoading } = useQuery({
    queryKey: ["si2pem", "measurements", tab, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchPlannedMeasurements({ page: pagination.pageIndex + 1, limit: pagination.pageSize, status: tab }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10,
  });
  const measurements = data?.data ?? [];
  const totalItems = data?.totalCount ?? 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b shrink-0">
        <h1 className="text-lg font-semibold">{t("page.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("page.description")}</p>
        <ButtonGroup className="mt-3">
          <Button
            size="sm"
            variant={tab === "PLANNED" ? "default" : "outline"}
            onClick={() => {
              setTab("PLANNED");
              resetPage();
            }}
          >
            Planowane
          </Button>
          <Button
            size="sm"
            variant={tab === "COMPLETED" ? "default" : "outline"}
            onClick={() => {
              setTab("COMPLETED");
              resetPage();
            }}
          >
            Zakończone
          </Button>
          <Button
            size="sm"
            variant={tab === "CANCELED" ? "default" : "outline"}
            onClick={() => {
              setTab("CANCELED");
              resetPage();
            }}
          >
            Odwołane
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex-1 flex flex-col pl-3 pt-3 pr-3 min-h-0 overflow-hidden">
        <div ref={containerRef} className={cn("h-full overflow-x-auto", pagination.pageSize > autoPageSize ? "overflow-y-auto" : "overflow-y-clip")}>
          <MeasurementsDataTable
            data={measurements}
            isLoading={isLoading}
            totalItems={totalItems}
            pagination={pagination}
            onPaginationChange={setPagination}
            pageSizeOptions={pageSizeOptions}
            t={t}
            tCommon={tCommon}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/si2pem")({
  component: SI2PEMPage,
});
