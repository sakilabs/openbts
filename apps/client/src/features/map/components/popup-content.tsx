import { useTranslation } from "react-i18next";
import { getOperatorColor } from "@/lib/operator-utils";
import { getStationTechs } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LocationInfo, StationWithoutCells, StationSource } from "@/types/station";

type PopupContentProps = {
	location: LocationInfo;
	stations: StationWithoutCells[] | null;
	source: StationSource;
	onOpenDetails: (id: number) => void;
};

function StationSkeleton() {
	return (
		<div className="px-3 py-2 border-b border-border/30 last:border-0">
			<div className="flex items-center gap-1.5">
				<Skeleton className="size-2 rounded-full" />
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-2.5 w-12" />
			</div>
			<div className="flex gap-1 mt-1.5 pl-3.5">
				<Skeleton className="h-4 w-8 rounded-md" />
				<Skeleton className="h-4 w-10 rounded-md" />
			</div>
		</div>
	);
}

function TechBadgesSkeleton() {
	return (
		<div className="flex gap-1 mt-1 pl-3.5">
			<Skeleton className="h-4 w-8 rounded-md" />
			<Skeleton className="h-4 w-10 rounded-md" />
		</div>
	);
}

export function PopupContent({ location, stations, source, onOpenDetails }: PopupContentProps) {
	const { t } = useTranslation("map");

	return (
		<div className="w-72 text-sm">
			<div className="px-3 py-2 border-b border-border/50">
				<h3 className="font-medium text-sm leading-tight pr-4">{location.address || location.city}</h3>
				<p className="text-[11px] text-muted-foreground">{location.city}</p>
			</div>

			<div className="max-h-52 overflow-y-auto custom-scrollbar">
				{stations === null ? (
					<>
						<StationSkeleton />
						<StationSkeleton />
					</>
				) : stations.length === 0 ? (
					<div className="px-3 py-4 text-center text-muted-foreground text-xs">
						{t("popup.noStations")}
					</div>
				) : (
					stations.map((station) => {
						const mnc = station.operator?.mnc;
						const operatorName = station.operator?.name || t("popup.unknownOperator");
						const stationId = station.station_id;
						const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
						const hasCells = station.cells !== undefined;
						const techs = hasCells && station.cells?.length ? getStationTechs(station.cells) : [];

						return (
							<button
								type="button"
								key={station.id}
								className="w-full text-left px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0"
								onClick={() => onOpenDetails(station.id)}
							>
								<div className="flex items-center gap-1.5">
									<div className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
									<span className="font-medium text-xs" style={{ color }}>
										{operatorName}
									</span>
									<span className="text-[10px] text-muted-foreground">{stationId}</span>
								</div>
								{source === "internal" && (
									hasCells ? (
										techs.length > 0 && (
											<div className="flex flex-wrap gap-1 mt-1 pl-3.5">
												{techs.map((tech) => (
													<span
														key={tech}
														className="px-1.5 py-0.5 rounded-md bg-muted text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50"
													>
														{tech}
													</span>
												))}
											</div>
										)
									) : (
										<TechBadgesSkeleton />
									)
								)}
							</button>
						);
					})
				)}
			</div>

			<div className="px-3 py-1.5 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
				GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
			</div>
		</div>
	);
}
