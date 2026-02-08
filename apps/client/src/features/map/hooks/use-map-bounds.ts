import { useEffect, useRef, useState } from "react";

type UseMapBoundsArgs = {
	map: maplibregl.Map | null;
	isLoaded: boolean;
	debounceMs?: number;
};

export function useMapBounds({ map, isLoaded, debounceMs = 300 }: UseMapBoundsArgs) {
	const [bounds, setBounds] = useState("");
	const [zoom, setZoom] = useState(0);
	const [isMoving, setIsMoving] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const debounceMsRef = useRef(debounceMs);
	const isFirstUpdateRef = useRef(true);
	debounceMsRef.current = debounceMs;

	useEffect(() => {
		if (!map || !isLoaded) return;

		const updateBounds = () => {
			setZoom(map.getZoom());

			if (isFirstUpdateRef.current) {
				isFirstUpdateRef.current = false;
				const mapBounds = map.getBounds();
				setBounds(`${mapBounds.getSouth()},${mapBounds.getWest()},${mapBounds.getNorth()},${mapBounds.getEast()}`);
				return;
			}

			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				const mapBounds = map.getBounds();
				setBounds(`${mapBounds.getSouth()},${mapBounds.getWest()},${mapBounds.getNorth()},${mapBounds.getEast()}`);
			}, debounceMsRef.current);
		};

		const onMoveStart = () => setIsMoving(true);
		const onMoveEnd = () => {
			setIsMoving(false);
			updateBounds();
		};

		updateBounds();

		map.on("movestart", onMoveStart);
		map.on("moveend", onMoveEnd);

		return () => {
			map.off("movestart", onMoveStart);
			map.off("moveend", onMoveEnd);
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [map, isLoaded]);

	return { bounds, zoom, isMoving };
}
