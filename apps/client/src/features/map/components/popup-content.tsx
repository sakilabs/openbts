import { memo } from "react";
import { useTranslation } from "react-i18next";
import { getOperatorColor } from "@/lib/operator-utils";
import { getStationTechs, getPermitTechs } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LocationInfo, StationWithoutCells, StationSource, UkeStation } from "@/types/station";

type PopupContentProps = {
	location: LocationInfo;
	stations: StationWithoutCells[] | null;
	ukeStations?: UkeStation[] | null;
	source: StationSource;
	onOpenStationDetails: (id: number) => void;
	onOpenUkeStationDetails: (station: UkeStation) => void;
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

export const PopupContent = memo(function PopupContent({
	location,
	stations,
	ukeStations,
	source,
	onOpenStationDetails,
	onOpenUkeStationDetails,
}: PopupContentProps) {
	const { t } = useTranslation("map");

	const isUkeSource = source === "uke";
	const items = isUkeSource ? ukeStations : stations;
	const isLoading = !items;
	const isEmpty = !isLoading && items.length === 0;

	return (
		<div className="w-72 text-sm">
			<div className="px-3 py-2 border-b border-border/50">
				<h3 className="font-medium text-sm leading-tight pr-4">{location.address || location.city}</h3>
				<p className="text-[11px] text-muted-foreground">{location.city}</p>
			</div>

			<div className="max-h-52 overflow-y-auto custom-scrollbar">
				{isLoading ? (
					<>
						<StationSkeleton />
						<StationSkeleton />
					</>
				) : isEmpty ? (
					<div className="px-3 py-4 text-center text-muted-foreground text-xs">{isUkeSource ? t("popup.noPermits") : t("popup.noStations")}</div>
				) : isUkeSource && ukeStations ? (
					ukeStations.map((station) => {
						const mnc = station.operator?.mnc;
						const operatorName = station.operator?.name || t("popup.unknownOperator");
						const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
						const techs = getPermitTechs(station.permits);
						const hasExpired = station.permits.some((p) => {
							const expiryDate = new Date(p.expiry_date);
							return expiryDate < new Date();
						});

						return (
							<button
								type="button"
								key={station.station_id}
								className="w-full text-left px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0"
								onClick={() => onOpenUkeStationDetails(station)}
							>
								<div className="flex items-center gap-1.5">
									<div className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
									<span className="font-medium text-xs" style={{ color }}>
										{operatorName}
									</span>
									<span className="text-[10px] text-muted-foreground font-mono">{station.station_id}</span>
								</div>
								<div className="flex flex-wrap gap-1 mt-1 pl-3.5">
									{techs.map((tech) => (
										<span
											key={tech}
											className="px-1.5 py-0.5 rounded-md bg-muted text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50"
										>
											{tech}
										</span>
									))}
									<span className="px-1.5 py-0.5 rounded-md bg-muted text-[9px] font-mono font-medium text-muted-foreground border border-border/50">
										{station.permits.length} {station.permits.length === 1 ? t("popup.permit") : t("popup.permits")}
									</span>
									{hasExpired && (
										<span className="px-1.5 py-0.5 rounded-md bg-destructive/10 text-[9px] font-semibold uppercase tracking-wider text-destructive border border-destructive/20">
											{t("popup.expired")}
										</span>
									)}
								</div>
							</button>
						);
					})
				) : stations ? (
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
								onClick={() => onOpenStationDetails(station.id)}
							>
								<div className="flex items-center gap-1.5">
									<div className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
									<span className="font-medium text-xs" style={{ color }}>
										{operatorName}
									</span>
									<span className="text-[10px] text-muted-foreground">{stationId}</span>
								</div>
								{hasCells ? (
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
								)}
							</button>
						);
					})
				) : null}
			</div>

			<div className="px-3 py-1.5 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
				GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
			</div>
		</div>
	);
});
