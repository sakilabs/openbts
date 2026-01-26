import { useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import MapLibreGL from "maplibre-gl";
import type { Station, StationSource } from "@/types/station";
import { PopupContent } from "../components/popup-content";

type UseMapPopupArgs = {
	map: maplibregl.Map | null;
	onOpenDetails: (id: number, source: StationSource) => void;
};

export function useMapPopup({ map, onOpenDetails }: UseMapPopupArgs) {
	const popupRef = useRef<MapLibreGL.Popup | null>(null);
	const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

	const showPopup = useCallback(
		(coordinates: [number, number], stations: Station[], source: StationSource) => {
			if (!map) return;
			if (popupRef.current) popupRef.current.remove();
			if (popupRootRef.current) popupRootRef.current.unmount();

			const container = document.createElement("div");
			container.className = "station-popup-container";

			popupRootRef.current = createRoot(container);
			popupRootRef.current.render(
				<PopupContent
					stations={stations}
					source={source}
					onOpenDetails={(id) => {
						onOpenDetails(id, source);
						popupRef.current?.remove();
					}}
				/>,
			);

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
		[map, onOpenDetails],
	);

	const closePopup = useCallback(() => {
		popupRef.current?.remove();
	}, []);

	const cleanup = useCallback(() => {
		popupRef.current?.remove();
		popupRootRef.current?.unmount();
	}, []);

	return { showPopup, closePopup, cleanup };
}
