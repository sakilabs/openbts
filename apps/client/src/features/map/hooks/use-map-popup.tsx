import { useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import MapLibreGL from "maplibre-gl";
import type { StationSource, LocationInfo, StationWithoutCells, UkeStation } from "@/types/station";
import { PopupContent } from "../components/popup-content";

type UseMapPopupArgs = {
	map: maplibregl.Map | null;
	onOpenStationDetails: (id: number, source: StationSource) => void;
	onOpenUkeStationDetails: (station: UkeStation) => void;
};

export function useMapPopup({ map, onOpenStationDetails, onOpenUkeStationDetails }: UseMapPopupArgs) {
	const popupRef = useRef<MapLibreGL.Popup | null>(null);
	const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

	const renderPopup = useCallback(
		(location: LocationInfo, stations: StationWithoutCells[] | null, ukeStations: UkeStation[] | null, source: StationSource) => {
			if (!popupRootRef.current) return;

			popupRootRef.current.render(
				<PopupContent
					location={location}
					stations={stations}
					ukeStations={ukeStations ?? undefined}
					source={source}
					onOpenStationDetails={(id) => {
						onOpenStationDetails(id, source);
						popupRef.current?.remove();
					}}
					onOpenUkeStationDetails={(station) => {
						onOpenUkeStationDetails(station);
						popupRef.current?.remove();
					}}
				/>,
			);
		},
		[onOpenStationDetails, onOpenUkeStationDetails],
	);

	const showPopup = useCallback(
		(
			coordinates: [number, number],
			location: LocationInfo,
			stations: StationWithoutCells[] | null,
			ukeStations: UkeStation[] | null,
			source: StationSource,
		) => {
			if (!map) return;

			popupRef.current?.remove();
			popupRootRef.current?.unmount();

			const container = document.createElement("div");
			container.className = "station-popup-container";

			popupRootRef.current = createRoot(container);
			renderPopup(location, stations, ukeStations, source);

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
			renderPopup(location, stations, null, source);
		},
		[renderPopup],
	);

	const cleanup = useCallback(() => {
		popupRef.current?.remove();
		popupRootRef.current?.unmount();
	}, []);

	return { showPopup, updatePopupStations, cleanup };
}
