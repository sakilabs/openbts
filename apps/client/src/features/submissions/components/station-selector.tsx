import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, AirportTowerIcon, Add01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOperatorColor } from "@/lib/operator-utils";
import { formatCoordinates } from "@/lib/gps-utils";
import { usePreferences } from "@/hooks/use-preferences";
import { searchStations, type SearchStation } from "../api";
import type { SubmissionMode } from "../types";

type StationSelectorProps = {
	mode: SubmissionMode;
	selectedStation: SearchStation | null;
	onModeChange: (mode: SubmissionMode) => void;
	onStationSelect: (station: SearchStation | null) => void;
};

export function StationSelector({ mode, selectedStation, onModeChange, onStationSelect }: StationSelectorProps) {
	const { t } = useTranslation("submissions");
	const { preferences } = usePreferences();
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
		return () => clearTimeout(debounceRef.current);
	}, [searchQuery]);

	const { data: searchResults = [], isLoading } = useQuery({
		queryKey: ["stations-search", debouncedQuery],
		queryFn: () => searchStations(debouncedQuery),
		enabled: debouncedQuery.length >= 2,
		staleTime: 1000 * 30,
	});

	const handleStationSelect = useCallback(
		(station: SearchStation) => {
			onStationSelect(station);
			setSearchQuery("");
			setIsOpen(false);
		},
		[onStationSelect],
	);

	const handleClearSelection = useCallback(() => {
		onStationSelect(null);
		setSearchQuery("");
	}, [onStationSelect]);

	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
		setIsOpen(true);
	}, []);

	const handleSearchFocus = useCallback(() => {
		setIsOpen(true);
	}, []);

	return (
		<div className="border rounded-xl bg-card relative">
			<div className="p-2 border-b bg-muted/30 flex items-center justify-between gap-4">
				<div className="flex items-center gap-2 px-2">
					<div className="p-1.5 rounded-md bg-primary/10 text-primary">
						<HugeiconsIcon icon={AirportTowerIcon} className="size-4" />
					</div>
					<span className="font-semibold text-sm tracking-tight">{t("stationSelector.title")}</span>
				</div>
				<div className="flex items-center p-1 bg-muted/50 rounded-lg border shadow-sm">
					<button
						type="button"
						onClick={() => onModeChange("existing")}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
							mode === "existing"
								? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
								: "text-muted-foreground hover:text-foreground hover:bg-background/50",
						)}
					>
						<HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
						{t("stationSelector.existingStation")}
					</button>
					<button
						type="button"
						onClick={() => onModeChange("new")}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
							mode === "new"
								? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
								: "text-muted-foreground hover:text-foreground hover:bg-background/50",
						)}
					>
						<HugeiconsIcon icon={Add01Icon} className="size-3.5" />
						{t("stationSelector.newStation")}
					</button>
				</div>
			</div>

			<div className="p-4">
				{mode === "existing" && (
					<div>
						{selectedStation ? (
							<div className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-muted/30">
								<div className="flex items-start gap-3">
									<div
										className="size-3 rounded-full shrink-0 mt-1"
										style={{ backgroundColor: getOperatorColor(selectedStation.operator?.mnc ?? 0) }}
									/>
									<div className="min-w-0 space-y-1">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium truncate">
												{selectedStation.location?.address || selectedStation.location?.city || t("stationSelector.noAddress")}
											</span>
											<span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
												{selectedStation.station_id}
											</span>
										</div>
										<div className="text-xs text-muted-foreground">
											<span className="font-medium text-foreground/80">{t("stationSelector.region")}</span>
											<span className="mx-1">•</span>
											{selectedStation.location?.region?.name ?? t("stationSelector.noRegion")}
										</div>
										<div className="text-xs text-muted-foreground font-mono">
											<span className="font-sans font-medium text-foreground/80">{t("stationSelector.gps")}</span>
											<span className="mx-1 font-sans">•</span>
											{selectedStation.location
												? formatCoordinates(selectedStation.location.latitude, selectedStation.location.longitude, preferences.gpsFormat)
												: t("stationSelector.noGps")}
										</div>
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-muted-foreground">{selectedStation.operator?.name}</span>
											{selectedStation.cells?.length > 0 && (
												<>
													<span className="text-xs text-muted-foreground/50">•</span>
													<span className="text-xs text-muted-foreground">
														{t("stationSelector.cellsCount", { count: selectedStation.cells.length })}
													</span>
												</>
											)}
										</div>
									</div>
								</div>
								<Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-7 text-xs shrink-0">
									{t("common.clear")}
								</Button>
							</div>
						) : (
							<div className="relative">
								<HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									placeholder={t("stationSelector.searchPlaceholder")}
									value={searchQuery}
									onChange={handleSearchChange}
									onFocus={handleSearchFocus}
									className="pl-10 h-9"
								/>

								{isOpen && searchQuery.length >= 2 && (
									<div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
										{isLoading ? (
											<div className="p-3 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
										) : searchResults.length === 0 ? (
											<div className="p-3 text-center text-sm text-muted-foreground">{t("stationSelector.noResults")}</div>
										) : (
											<div className="p-1 space-y-0.5">
												{searchResults.map((station) => (
													<button
														type="button"
														key={station.id}
														onClick={() => handleStationSelect(station)}
														className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-all text-left group cursor-pointer"
													>
														<div
															className="size-2.5 rounded-full shrink-0 shadow-sm border border-white dark:border-gray-800 transition-transform group-hover:scale-125"
															style={{ backgroundColor: getOperatorColor(station.operator?.mnc ?? 0) }}
														/>
														<div className="flex-1 min-w-0">
															<div className="flex items-center justify-between gap-2">
																<span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
																	{station.location?.address || station.location?.city || t("stationSelector.noAddress")}
																</span>
																<span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
																	{station.station_id}
																</span>
															</div>
															<div className="flex items-center gap-1.5 mt-0.5">
																<span className="text-[11px] font-medium text-foreground/70 italic">{station.operator?.name}</span>
																<span className="text-[11px] text-muted-foreground/50">•</span>
																<span className="text-[11px] text-muted-foreground">{station.location?.city}</span>
																{station.cells?.length > 0 && (
																	<>
																		<span className="text-[11px] text-muted-foreground/50">•</span>
																		<span className="text-[11px] text-muted-foreground">
																			{t("stationSelector.cellsCount", { count: station.cells.length })}
																		</span>
																	</>
																)}
															</div>
														</div>
													</button>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{mode === "new" && <p className="text-sm text-muted-foreground">{t("stationSelector.newStationHint")}</p>}
			</div>
		</div>
	);
}
