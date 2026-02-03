"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useMap } from "@/components/ui/map";
import { calculateDistance, calculateBearing, calculateTA } from "../utils";
import { Separator } from "@/components/ui/separator";

type MapCursorInfoProps = {
	activeMarker?: { latitude: number; longitude: number } | null;
	className?: string;
};

export function MapCursorInfo({ activeMarker, className }: MapCursorInfoProps) {
	const { map } = useMap();
	const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		if (!map) return;
		if (!map.getSource("cursor-measure-line")) {
			map.addSource("cursor-measure-line", {
				type: "geojson",
				data: { type: "FeatureCollection", features: [] },
			});
		}

		if (!map.getLayer("cursor-measure-line")) {
			map.addLayer({
				id: "cursor-measure-line",
				type: "line",
				source: "cursor-measure-line",
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
				paint: {
					"line-color": "#f59f0b",
					"line-width": 2,
					"line-dasharray": [2, 1],
				},
			});
		}

		return () => {
			if (map.getStyle() === undefined) return;

			if (map.getLayer("cursor-measure-line")) map.removeLayer("cursor-measure-line");
			if (map.getSource("cursor-measure-line")) map.removeSource("cursor-measure-line");
		};
	}, [map]);

	useEffect(() => {
		if (!map) return;

		setCursor((prev) => prev || map.getCenter());

		const onMouseMove = (e: maplibregl.MapMouseEvent) => {
			setCursor(e.lngLat);
		};

		map.on("mousemove", onMouseMove);

		return () => {
			map.off("mousemove", onMouseMove);
		};
	}, [map]);

	useEffect(() => {
		if (!map) return;

		const source = map.getSource("cursor-measure-line") as maplibregl.GeoJSONSource;
		if (!source) return;

		if (activeMarker && cursor) {
			source.setData({
				type: "Feature",
				properties: {},
				geometry: {
					type: "LineString",
					coordinates: [
						[activeMarker.longitude, activeMarker.latitude],
						[cursor.lng, cursor.lat],
					],
				},
			});
		} else {
			source.setData({ type: "FeatureCollection", features: [] });
		}
	}, [map, activeMarker, cursor]);

	let metrics = null;
	if (activeMarker && cursor) {
		const distMeters = calculateDistance(activeMarker.latitude, activeMarker.longitude, cursor.lat, cursor.lng);
		const bearing = calculateBearing(activeMarker.latitude, activeMarker.longitude, cursor.lat, cursor.lng);
		const ta = calculateTA(distMeters);

		metrics = {
			dist: distMeters > 1000 ? `${(distMeters / 1000).toFixed(2)} km` : `${Math.round(distMeters)} m`,
			bearing: Math.round(bearing),
			ta,
		};
	}

	return (
		<div className={cn("pointer-events-none select-none invisible md:visible", className)}>
			<div className="flex items-stretch shadow-xl rounded-lg overflow-hidden border bg-background/95 backdrop-blur-md">
				<div className="px-2.5 py-1.5 flex items-center gap-2 border-r border-border/50">
					<div className="flex items-baseline gap-1.5">
						<span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">GPS</span>
						<span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">
							{cursor ? `${cursor.lat.toFixed(5)}, ${cursor.lng.toFixed(5)}` : "0.00000, 0.00000"}
						</span>
					</div>
				</div>

				{metrics && (
					<div className="bg-muted/30 px-2.5 py-1.5 flex items-center gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">REF</span>
							<span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">
								{activeMarker?.latitude.toFixed(5)}, {activeMarker?.longitude.toFixed(5)}
							</span>
						</div>

						<div className="w-px h-3 bg-border/60" />

						<div className="flex items-center gap-1.5">
							<span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">Dist</span>
							<span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">{metrics.dist}</span>
						</div>

						<div className="w-px h-3 bg-border/60" />

						<div className="flex items-center gap-1.5">
							<span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">Azm</span>
							<span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">{metrics.bearing}°</span>
						</div>

						<div className="w-px h-3 bg-border/60" />

						<div className="flex items-center gap-1.5">
							<span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">TA</span>
							<div className="flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums text-foreground leading-none">
								<span className="flex items-center gap-0.5" title="GSM Timing Advance">
									<span className="text-[8px] text-muted-foreground/70">GSM</span>
									{metrics.ta.gsm}
								</span>
								<Separator orientation="vertical" className="h-3 bg-border/50" />
								<span className="flex items-center gap-0.5" title="UMTS Chips (One-way)">
									<span className="text-[8px] text-muted-foreground/70">UMTS</span>
									{metrics.ta.umts}
								</span>
								<Separator orientation="vertical" className="h-3 bg-border/50" />
								<span className="flex items-center gap-0.5" title="LTE Timing Advance">
									<span className="text-[8px] text-muted-foreground/70">LTE</span>
									{metrics.ta.lte}
								</span>
								<Separator orientation="vertical" className="h-3 bg-border/50" />
								<span className="flex items-center gap-0.5" title="NR Timing Advance (SCS 30kHz)">
									<span className="text-[8px] text-muted-foreground/70">NR</span>
									{metrics.ta.nr}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
