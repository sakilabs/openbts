import { Map as LibreMap, MapControls } from "@/components/ui/map";
import { POLAND_CENTER } from "../constants";
import { StationsLayer } from "./stationsLayer";

const POLAND_BOUNDS: [[number, number], [number, number]] = [
	[14.0, 48.9],
	[24.2, 55.0],
];

export default function MapView() {
	return (
		<LibreMap center={POLAND_CENTER} zoom={7} maxBounds={POLAND_BOUNDS} minZoom={5}>
			<StationsLayer />
			<MapControls showLocate showCompass />
		</LibreMap>
	);
}
