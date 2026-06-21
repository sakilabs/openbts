import { QueryClientProvider } from "@tanstack/react-query";
import { type Map as MaplibreMap, Popup } from "maplibre-gl";
import { useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";

import { queryClient } from "@/lib/queryClient";
import type { LocationInfo, StationSource, StationWithoutCells, UkeStation } from "@/types/station";

import { PopupContent } from "../components/popupContent";

type UseMapPopupArgs = {
  map: MaplibreMap | null;
  showAddToList?: boolean;
  onOpenStationDetails: (id: number, source: StationSource) => boolean | void;
  onOpenUkeStationDetails: (station: UkeStation) => boolean | void;
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
  const popupRef = useRef<Popup | null>(null);
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
              const didOpen = onOpenStationDetails(id, source);
              if (didOpen !== false) popupRef.current?.remove();
            }}
            onOpenUkeStationDetails={(station) => {
              const didOpen = onOpenUkeStationDetails(station);
              if (didOpen !== false) popupRef.current?.remove();
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

      const popup = new Popup({
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
