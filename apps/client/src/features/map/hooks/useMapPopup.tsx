import { useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import MapLibreGL from "maplibre-gl";
import type { StationSource, LocationInfo, StationWithoutCells, UkeStation } from "@/types/station";
import { queryClient } from "@/lib/queryClient";
import { PopupContent } from "../components/popupContent";

type UseMapPopupArgs = {
  map: maplibregl.Map | null;
  showAddToList?: boolean;
  onOpenStationDetails: (id: number, source: StationSource) => void;
  onOpenUkeStationDetails: (station: UkeStation) => void;
  onClose?: () => void;
};

type UseMapPopupReturn = {
  showPopup: (
    coordinates: [number, number],
    location: LocationInfo,
    stations: StationWithoutCells[] | null,
    ukeStations: UkeStation[] | null,
    source: StationSource,
  ) => void;
  updatePopupStations: (location: LocationInfo, stations: StationWithoutCells[], source: StationSource) => void;
  cleanup: () => void;
};

export function useMapPopup({ map, showAddToList, onOpenStationDetails, onOpenUkeStationDetails, onClose }: UseMapPopupArgs): UseMapPopupReturn {
  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  const renderPopup = useCallback(
    (location: LocationInfo, stations: StationWithoutCells[] | null, ukeStations: UkeStation[] | null, source: StationSource) => {
      if (!popupRootRef.current) return;

      popupRootRef.current.render(
        <QueryClientProvider client={queryClient}>
          <PopupContent
            location={location}
            stations={stations}
            ukeStations={ukeStations ?? undefined}
            source={source}
            showAddToList={showAddToList}
            onOpenStationDetails={(id) => {
              onOpenStationDetails(id, source);
              popupRef.current?.remove();
            }}
            onOpenUkeStationDetails={(station) => {
              onOpenUkeStationDetails(station);
              popupRef.current?.remove();
            }}
          />
        </QueryClientProvider>,
      );
    },
    [showAddToList, onOpenStationDetails, onOpenUkeStationDetails],
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

      const popup = new MapLibreGL.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: "none",
        offset: 12,
      })
        .setLngLat(coordinates)
        .setDOMContent(container)
        .addTo(map);

      if (onClose) void popup.once("close", onClose);

      popupRef.current = popup;
    },
    [map, renderPopup, onClose],
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
