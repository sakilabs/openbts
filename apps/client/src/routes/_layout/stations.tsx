import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useState } from "react";

import { StationsListLayout } from "@/features/stations/components/stationsFilterLayout";
import { useStationsData } from "@/features/stations/hooks/useStationsData";
import type { Station } from "@/types/station";

const StationDetailsDialog = lazy(() =>
  import("@/features/station-details/components/stationsDetailsDialog").then((m) => ({ default: m.StationDetailsDialog })),
);

function StationsListPage() {
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const data = useStationsData();
  const handleRowClick = useCallback((station: Station) => setSelectedStationId(station.id), []);

  return (
    <StationsListLayout data={data} onRowClick={handleRowClick}>
      <Suspense fallback={null}>
        <StationDetailsDialog key={selectedStationId} stationId={selectedStationId} source="internal" onClose={() => setSelectedStationId(null)} />
      </Suspense>
    </StationsListLayout>
  );
}

export const Route = createFileRoute("/_layout/stations")({
  component: StationsListPage,
  staticData: {
    titleKey: "items.database",
    i18nNamespace: "nav",
    breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
  },
});
