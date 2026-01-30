import { Map as LibreMap, MapControls } from "@/components/ui/map";
import { StationsLayer } from "./stations-layer";

const POLAND_BOUNDS: [[number, number], [number, number]] = [
	[14.0, 48.9],
	[24.2, 55.0],
];

export default function MapView() {
	return (
		<LibreMap center={[19.1451, 51.9194]} zoom={7} maxBounds={POLAND_BOUNDS} minZoom={5} maxZoom={18}>
			<StationsLayer />
			<MapControls showLocate showCompass />
		</LibreMap>
	);
}
