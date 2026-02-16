import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { StationsListLayout } from "@/features/stations/components/stationsFilterLayout";
import { useStationsData } from "@/features/stations/hooks/useStationsData";
import type { Station } from "@/types/station";

function AdminStationsListPage() {
  const { t } = useTranslation("stations");
  const navigate = useNavigate();
  const data = useStationsData();
  const handleRowClick = useCallback((station: Station) => navigate({ to: "/admin/stations/$id", params: { id: String(station.id) } }), [navigate]);

  return (
    <StationsListLayout
      data={data}
      onRowClick={handleRowClick}
      headerActions={
        <Button size="sm" onClick={() => navigate({ to: "/admin/stations/$id", params: { id: "new" } })}>
          <HugeiconsIcon icon={Add01Icon} className="size-4 mr-2" />
          {t("actions.newStation")}
        </Button>
      }
    />
  );
}

export const Route = createFileRoute("/_layout/admin/stations/")({
  component: AdminStationsListPage,
  staticData: {
    titleKey: "breadcrumbs.stations",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", i18nNamespace: "admin" }],
  },
});
