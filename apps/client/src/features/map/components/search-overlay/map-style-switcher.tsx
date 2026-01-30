"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMap, type MapStyle } from "@/components/ui/map";

const MAP_STYLE_OPTIONS: Record<MapStyle, { label: string; thumbnail: string }> = {
	carto: {
		label: "Standard",
		thumbnail: "https://a.basemaps.cartocdn.com/dark_all/13/4400/2686.png",
	},
	osm: {
		label: "OpenStreetMap",
		thumbnail: "https://tile.openstreetmap.org/13/4400/2686.png",
	},
	satellite: {
		label: "Esri Satellite",
		thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/2686/4400",
	},
};

type MapStyleSwitcherProps = {
	position?: "default" | "mobile";
};

export function MapStyleSwitcher({ position = "default" }: MapStyleSwitcherProps) {
	const { mapStyle, setMapStyle } = useMap();
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		if (!showPicker) return;

		const handleClickOutside = () => setShowPicker(false);

		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, [showPicker]);

	const handleSelectStyle = useCallback(
		(style: MapStyle) => {
			setMapStyle(style);
			setShowPicker(false);
		},
		[setMapStyle],
	);

	const handleStopPropagation = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
		e.stopPropagation();
	}, []);

	const isMobile = position === "mobile";

	if (showPicker) {
		return (
			<div
				onClick={handleStopPropagation}
				onKeyDown={handleStopPropagation}
				role="listbox"
				className={cn("flex gap-1.5 p-1.5 rounded-lg bg-background/95 backdrop-blur-md border shadow-xl", isMobile && "absolute bottom-0 left-0")}
			>
				{(Object.keys(MAP_STYLE_OPTIONS) as MapStyle[]).map((key) => {
					const style = MAP_STYLE_OPTIONS[key];
					const isSelected = mapStyle === key;
					return (
						<button
							key={key}
							type="button"
							onClick={() => handleSelectStyle(key)}
							className={cn("flex flex-col items-center group cursor-pointer", isMobile ? "gap-1" : "gap-0.5")}
						>
							<div
								className={cn(
									"w-12 h-12 rounded-md overflow-hidden border-2 transition-colors",
									isSelected ? "border-blue-500" : "border-transparent group-hover:border-muted-foreground/50",
								)}
							>
								<img src={style.thumbnail} alt={style.label} className="w-full h-full object-cover" />
							</div>
							<span className={cn("text-[10px] font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>{style.label}</span>
						</button>
					);
				})}
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setShowPicker(true)}
			className={cn(
				"w-8 h-8 rounded-md overflow-hidden border bg-background hover:border-muted-foreground/50 transition-colors cursor-pointer",
				isMobile ? "shadow-lg" : "shadow-xl",
			)}
			aria-label="Change map style"
		>
			<img src={MAP_STYLE_OPTIONS[mapStyle].thumbnail} alt={MAP_STYLE_OPTIONS[mapStyle].label} className="w-full h-full object-cover" />
		</button>
	);
}
