import { lazy, Suspense } from "react";
import { MapLoadingSkeleton } from "@/features/map/components/map-loading-skeleton";
import type { RouteHandle } from "./_layout";

const MapView = lazy(() => import("@/features/map/components/map-view"));

export const handle: RouteHandle = {
	titleKey: "items.mapView",
	i18nNamespace: "nav",
};

export default function Page() {
	return (
		<div className="flex-1">
			<Suspense fallback={<MapLoadingSkeleton />}>
				<MapView />
			</Suspense>
		</div>
	);
}
