import { useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import MapLibreGL from "maplibre-gl";
import type { StationSource, LocationInfo, StationWithoutCells } from "@/types/station";
import { PopupContent } from "../components/popup-content";

type UseMapPopupArgs = {
	map: maplibregl.Map | null;
	onOpenDetails: (id: number, source: StationSource) => void;
};

export function useMapPopup({ map, onOpenDetails }: UseMapPopupArgs) {
	const popupRef = useRef<MapLibreGL.Popup | null>(null);
	const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

	const renderPopup = useCallback(
		(location: LocationInfo, stations: StationWithoutCells[] | null, source: StationSource) => {
			if (!popupRootRef.current) return;

			popupRootRef.current.render(
				<PopupContent
					location={location}
					stations={stations}
					source={source}
					onOpenDetails={(id) => {
						onOpenDetails(id, source);
						popupRef.current?.remove();
					}}
				/>,
			);
		},
		[onOpenDetails],
	);

	const showPopup = useCallback(
		(coordinates: [number, number], location: LocationInfo, stations: StationWithoutCells[] | null, source: StationSource) => {
			if (!map) return;

			popupRef.current?.remove();
			popupRootRef.current?.unmount();

			const container = document.createElement("div");
			container.className = "station-popup-container";

			popupRootRef.current = createRoot(container);
			renderPopup(location, stations, source);

			popupRef.current = new MapLibreGL.Popup({
				closeButton: true,
				closeOnClick: true,
				maxWidth: "none",
				offset: 12,
			})
				.setLngLat(coordinates)
				.setDOMContent(container)
				.addTo(map);
		},
		[map, renderPopup],
	);

	const updatePopupStations = useCallback(
		(location: LocationInfo, stations: StationWithoutCells[], source: StationSource) => {
			renderPopup(location, stations, source);
		},
		[renderPopup],
	);

	const cleanup = useCallback(() => {
		popupRef.current?.remove();
		popupRootRef.current?.unmount();
	}, []);

	return { showPopup, updatePopupStations, cleanup };
}
