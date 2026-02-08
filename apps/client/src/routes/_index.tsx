import MapView from "@/features/map/components/map-view";
import type { RouteHandle } from "./_layout";

export const handle: RouteHandle = {
	titleKey: "items.mapView",
	i18nNamespace: "nav",
	breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
};

export default function Page() {
	return (
		<div className="flex-1">
			<MapView />
		</div>
	);
}
