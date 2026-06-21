import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { useStationDialogStack } from "@/features/station-details/components/stationDialogStackProvider";
import { StationsListLayout } from "@/features/stations/components/stationsFilterLayout";
import { useStationsData } from "@/features/stations/hooks/useStationsData";
import type { Station } from "@/types/station";

function StationsListPage() {
  const { openStationDialog } = useStationDialogStack();
  const data = useStationsData();
  const handleRowClick = useCallback((station: Station) => openStationDialog(station.id, "internal"), [openStationDialog]);

  return <StationsListLayout data={data} onRowClick={handleRowClick} />;
}

export const Route = createFileRoute("/_layout/stations")({
  component: StationsListPage,
  staticData: {
    titleKey: "items.database",
    i18nNamespace: "nav",
    breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
  },
});
