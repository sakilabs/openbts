import { useCallback, useState } from "react";
import { StationsListLayout } from "@/features/stations/components/stationsFilterLayout";
import { StationDetailsDialog } from "@/features/station-details/components/stationsDetailsDialog";
import { useStationsData } from "@/features/stations/hooks/useStationsData";
import type { Station } from "@/types/station";
import type { RouteHandle } from "./_layout";

export const handle: RouteHandle = {
	titleKey: "items.database",
	i18nNamespace: "nav",
	breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
};

export default function StationsListPage() {
	const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
	const data = useStationsData();
	const handleRowClick = useCallback((station: Station) => setSelectedStationId(station.id), []);

	return (
		<StationsListLayout data={data} onRowClick={handleRowClick}>
			<StationDetailsDialog key={selectedStationId} stationId={selectedStationId} source="internal" onClose={() => setSelectedStationId(null)} />
		</StationsListLayout>
	);
}
