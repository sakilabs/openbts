"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PencilEdit02Icon, Tick02Icon, Wifi01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router";
import { getOperatorColor } from "@/lib/operator-utils";
import { getHardwareLeaseOperator } from "@/lib/station-utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useSettings } from "@/hooks/use-settings";
import { fetchStation } from "../api";
import { StationDetailsBody } from "./dialog-body";
import { ShareButton } from "./share-button";
import type { TabId } from "../tabs";

type StationDetailsDialogProps = {
	stationId: number | null;
	source: "internal" | "uke";
	onClose: () => void;
};

function getDefaultTab(source: "internal" | "uke"): TabId {
	return source === "uke" ? "permits" : "specs";
}

export function StationDetailsDialog({ stationId, source, onClose }: StationDetailsDialogProps) {
	const { t } = useTranslation("stationDetails");
	const [activeTab, setActiveTab] = useState<TabId>(() => getDefaultTab(source));
	const { data: settings } = useSettings();

	const {
		data: station,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["station", stationId, source],
		queryFn: () => fetchStation(stationId as number),
		enabled: !!stationId && source === "internal",
		staleTime: 1000 * 60 * 5,
	});

	useEscapeKey(onClose, !!stationId);

	if (!stationId) return null;

	const operatorColor = station ? getOperatorColor(station.operator.mnc) : "#3b82f6";

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto sm:items-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Enter" && onClose()}
				aria-label={t("dialog.closeLabel")}
			/>

			<div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				<div className="shrink-0 bg-background/95 backdrop-blur-sm border-b">
					<div className="px-6 py-4 flex items-start gap-4">
						<div
							className="size-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
							style={{ backgroundColor: operatorColor }}
						>
							<HugeiconsIcon icon={Wifi01Icon} className="size-6" />
						</div>
						<div className="flex-1 min-w-0">
							{isLoading ? (
								<div className="space-y-2">
									<div className="h-5 w-48 bg-muted rounded animate-pulse" />
									<div className="h-4 w-32 bg-muted rounded animate-pulse" />
								</div>
							) : station ? (
								<div className="flex flex-col gap-1.5">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2 min-w-0">
											<h2 className="text-lg font-bold tracking-tight truncate" style={{ color: operatorColor }}>
												{station.operator.name}
											</h2>
											{getHardwareLeaseOperator(station.station_id) ? (
												<Tooltip>
													<TooltipTrigger className="text-sm text-muted-foreground font-mono font-medium cursor-help underline decoration-dashed decoration-amber-500/50 underline-offset-2 shrink-0">
														{station.station_id}
													</TooltipTrigger>
													<TooltipContent>{t("dialog.hardwareLease", { operator: getHardwareLeaseOperator(station.station_id) })}</TooltipContent>
												</Tooltip>
											) : (
												<span className="text-sm text-muted-foreground font-mono font-medium shrink-0">{station.station_id}</span>
											)}
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<ShareButton
												title={`${station.operator.name} - ${station.station_id}`}
												text={`${station.operator.name} ${station.station_id} - ${station.location.city}`}
												url={`${window.location.origin}/#map=16/${station.location.latitude}/${station.location.longitude}?station=${station.id}`}
												size="md"
											/>
											{settings?.submissionsEnabled && (
												<Link
													to={`/submission?station=${station.id}`}
													className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold shadow-sm hover:bg-primary/20 transition-colors"
													onClick={onClose}
												>
													<HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
													<span className="hidden sm:inline">{t("dialog.edit")}</span>
												</Link>
											)}
											{station.is_confirmed && (
												<span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold shadow-sm">
													<HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
													<span className="hidden sm:inline">{t("dialog.confirmed")}</span>
												</span>
											)}
										</div>
									</div>
									<div className="flex flex-col gap-0.5">
										<p className="text-sm font-medium text-foreground/90 truncate">{station.location.address || t("dialog.btsStation")}</p>
										<p className="text-xs text-muted-foreground font-medium opacity-80">{station.location.city}</p>
									</div>
								</div>
							) : null}
						</div>
						<button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors shrink-0 -mt-1 -mr-2">
							<HugeiconsIcon icon={Cancel01Icon} className="size-5" />
						</button>
					</div>
				</div>

				<StationDetailsBody
					stationId={stationId}
					source={source}
					isLoading={isLoading}
					error={error}
					station={station}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
			</div>
		</div>
	);
}
