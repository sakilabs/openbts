"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
	openfreemap: {
		label: "OpenFreeMap",
		thumbnail: "https://a.basemaps.cartocdn.com/light_all/13/4400/2686.png",
	},
	satellite: {
		label: "Google Satellite",
		thumbnail: "https://mt1.google.com/vt/lyrs=s&x=4400&y=2686&z=13",
	},
	esriSatellite: {
		label: "Esri Satellite",
		thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/2686/4400",
	},
	opentopomap: {
		label: "OpenTopoMap",
		thumbnail: "https://a.tile.opentopomap.org/13/4400/2686.png",
	},
};

type MapStyleSwitcherProps = {
	position?: "default" | "mobile";
};

export function MapStyleSwitcher({ position = "default" }: MapStyleSwitcherProps) {
	const { t } = useTranslation("map");
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
			className={cn(
				"flex p-1.5 rounded-lg bg-background border shadow-xl",
				isMobile ? "absolute bottom-0 left-0 flex-col-reverse gap-1" : "flex-row gap-1.5",
			)}
		>
				{(Object.keys(MAP_STYLE_OPTIONS) as MapStyle[]).map((key) => {
					const style = MAP_STYLE_OPTIONS[key];
					const isSelected = mapStyle === key;
					return (
						<button
							key={key}
							type="button"
							onClick={() => handleSelectStyle(key)}
							className={cn(
								"flex items-center group cursor-pointer",
								isMobile ? "flex-row gap-2 px-1 py-0.5 rounded-md hover:bg-muted/50" : "flex-col gap-0.5",
							)}
						>
							<div
								className={cn(
									"rounded-md overflow-hidden border-2 transition-colors shrink-0",
									isMobile ? "w-8 h-8" : "w-12 h-12",
									isSelected ? "border-blue-500" : "border-transparent group-hover:border-muted-foreground/50",
								)}
							>
								<img src={style.thumbnail} alt={style.label} className="w-full h-full object-cover" />
							</div>
							<span className={cn("font-medium", isMobile ? "text-xs" : "text-[10px]", isSelected ? "text-foreground" : "text-muted-foreground")}>
								{style.label}
							</span>
						</button>
					);
				})}
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				setShowPicker(true);
			}}
			className={cn(
				"group flex items-center gap-2 p-1 rounded-lg bg-background border transition-all text-left",
				isMobile ? "shadow-lg" : "pr-3 shadow-xl",
			)}
			aria-label="Change map style"
		>
			<div className="w-8 h-8 rounded-md overflow-hidden border border-border/50 group-hover:border-border transition-colors">
				<img src={MAP_STYLE_OPTIONS[mapStyle].thumbnail} alt={MAP_STYLE_OPTIONS[mapStyle].label} className="w-full h-full object-cover" />
			</div>
			{!isMobile && (
				<div className="flex flex-col">
					<span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{t("overlay.mapStyle")}</span>
					<span className="text-xs font-semibold text-foreground leading-none">{MAP_STYLE_OPTIONS[mapStyle].label}</span>
				</div>
			)}
		</button>
	);
}
