import { useTranslation } from "react-i18next";
import { getOperatorColor } from "@/lib/operator-utils";
import { getStationTechs } from "../utils";

type PopupContentProps = {
	stations: any[];
	source: "internal" | "uke";
	onOpenDetails: (id: number) => void;
};

export function PopupContent({ stations, source, onOpenDetails }: PopupContentProps) {
	const { t } = useTranslation("map");
	const first = stations[0];
	const address = first.location?.address || first.address;
	const city = first.location?.city || first.city;
	const region = first.location?.region?.name;
	const lat = first.location?.latitude ?? first.latitude;
	const lng = first.location?.longitude ?? first.longitude;

	return (
		<div className="w-72 text-sm">
			<div className="px-3 py-2 border-b border-border/50">
				<h3 className="font-medium text-sm leading-tight pr-4">{address || city}</h3>
				<p className="text-[11px] text-muted-foreground">
					{city}
					{region ? ` · ${region}` : ""}
				</p>
			</div>

			<div className="max-h-52 overflow-y-auto custom-scrollbar">
				{stations.map((station) => {
					const mnc = source === "internal" ? station.operator.mnc : station.operator?.mnc;
					const operatorName = source === "internal" ? station.operator.name : station.operator?.name || t("popup.unknownOperator");
					const stationId = source === "internal" ? station.station_id : station.station_id || station.case_id;
					const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
					const techs = source === "internal" ? getStationTechs(station.cells) : [];

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
							{source === "internal" && techs.length > 0 && (
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
							)}
						</button>
					);
				})}
			</div>

			<div className="px-3 py-1.5 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
				GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
			</div>
		</div>
	);
}
