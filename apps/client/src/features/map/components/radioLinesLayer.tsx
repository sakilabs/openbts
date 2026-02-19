import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { useRadioLinesLayer } from "../hooks/useRadioLinesLayer";
import { radioLinesToGeoJSON } from "../geojson";
import { RadioLinePopupContent } from "./radioLinePopupContent";
import type { RadioLine } from "@/types/station";
import type { DuplexRadioLink } from "../utils";
import { groupRadioLinesIntoLinks } from "../utils";
import { usePreferences } from "@/hooks/usePreferences";

const RadioLineDetailsDialog = lazy(() =>
  import("@/features/station-details/components/radioLineDetailsDialog").then((m) => ({ default: m.RadioLineDetailsDialog })),
);

const EMPTY_LINES: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const EMPTY_ENDPOINTS: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

type RadioLinesLayerProps = {
  radioLines: RadioLine[];
};

export default function RadioLinesLayer({ radioLines }: RadioLinesLayerProps) {
  const { map, isLoaded } = useMap();
  const { preferences } = usePreferences();
  const [selectedLink, setSelectedLink] = useState<DuplexRadioLink | null>(null);

  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  const duplexLinks = useMemo(() => groupRadioLinesIntoLinks(radioLines), [radioLines]);

  const { lines, endpoints } = useMemo(() => {
    if (!radioLines.length) return { lines: EMPTY_LINES, endpoints: EMPTY_ENDPOINTS };
    return radioLinesToGeoJSON(radioLines);
  }, [radioLines]);

  const cleanupPopup = useCallback(() => {
    popupRef.current?.remove();
    popupRootRef.current?.unmount();
    popupRef.current = null;
    popupRootRef.current = null;
  }, []);

  const handleOpenDetails = useCallback(
    (link: DuplexRadioLink) => {
      setSelectedLink(link);
      cleanupPopup();
    },
    [cleanupPopup],
  );

  const handleFeatureClick = useCallback(
    (link: DuplexRadioLink, coordinates: [number, number]) => {
      if (!map) return;

      cleanupPopup();

      const container = document.createElement("div");
      container.className = "station-popup-container";

      const root = createRoot(container);
      popupRootRef.current = root;

      root.render(<RadioLinePopupContent link={link} coordinates={coordinates} onOpenDetails={handleOpenDetails} />);

      const popup = new MapLibreGL.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: "none",
        offset: 12,
      })
        .setLngLat(coordinates)
        .setDOMContent(container)
        .addTo(map);

      popupRef.current = popup;
    },
    [map, cleanupPopup, handleOpenDetails],
  );

  useRadioLinesLayer({
    map,
    isLoaded,
    linesGeoJSON: lines,
    endpointsGeoJSON: endpoints,
    duplexLinks,
    minZoom: preferences.radiolinesMinZoom,
    onFeatureClick: handleFeatureClick,
  });

  const handleCloseDetails = useCallback(() => setSelectedLink(null), []);

  return (
    <Suspense fallback={null}>
      {selectedLink && <RadioLineDetailsDialog key={selectedLink.groupId} link={selectedLink} onClose={handleCloseDetails} />}
    </Suspense>
  );
}
