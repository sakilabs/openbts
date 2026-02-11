"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowDown01Icon,
	Cancel01Icon,
	Globe02Icon,
	Wifi01Icon,
	Calendar03Icon,
	Location01Icon,
	Building02Icon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { getOperatorColor } from "@/lib/operatorUtils";
import { isPermitExpired } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { CopyButton } from "./copyButton";
import { ShareButton } from "./shareButton";
import { NavigationLinks } from "./navLinks";
import type { UkeStation, UkePermit } from "@/types/station";
import { RAT_ICONS } from "../utils";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";

type UkeStationDetailsDialogProps = {
	station: UkeStation | null;
	onClose: () => void;
};

function groupPermitsByRat(permits: UkePermit[]): Map<string, UkePermit[]> {
	const groups = new Map<string, UkePermit[]>();

	for (const permit of permits) {
		const rat = permit.band?.rat?.toUpperCase() || "OTHER";
		const existing = groups.get(rat) ?? [];
		existing.push(permit);
		groups.set(rat, existing);
	}

	const ratOrder = ["GSM", "UMTS", "LTE", "NR", "CDMA", "IOT", "OTHER"];
	const sorted = new Map<string, UkePermit[]>();
	for (const rat of ratOrder) {
		if (groups.has(rat)) {
			const getGroup = groups.get(rat);
			if (getGroup) sorted.set(rat, getGroup);
		}
	}

	return sorted;
}

export function UkePermitDetailsDialog({ station, onClose }: UkeStationDetailsDialogProps) {
	const { t, i18n } = useTranslation(["stationDetails", "common"]);
	const { preferences } = usePreferences();

	useEscapeKey(onClose, !!station);

	const permitsByRat = useMemo((): Map<string, UkePermit[]> => {
		if (!station) return new Map<string, UkePermit[]>();
		return groupPermitsByRat(station.permits);
	}, [station]);

	if (!station) return null;

	const operatorColor = station.operator?.mnc ? getOperatorColor(station.operator.mnc) : "#3b82f6";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Enter" && onClose()}
				aria-label={t("common:actions.close")}
			/>

			<div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				<div className="shrink-0 bg-background/95 backdrop-blur-sm border-b">
					<div className="px-6 py-4 flex items-start gap-4">
						<div
							className="size-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
							style={{ backgroundColor: operatorColor }}
						>
							<HugeiconsIcon icon={Wifi01Icon} className="size-6" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2 min-w-0">
									<h2 className="text-lg font-bold tracking-tight truncate" style={{ color: operatorColor }}>
										{station.operator?.name ?? t("permits.unknownOperator")}
									</h2>
									<span className="text-sm text-muted-foreground font-mono font-medium shrink-0">{station.station_id}</span>
								</div>
								{station.location && (
									<div className="flex flex-col gap-0.5">
										<p className="text-sm font-medium text-foreground/90 truncate">{station.location.address || t("dialog.btsStation")}</p>
										<p className="text-xs text-muted-foreground font-medium opacity-80">
											{station.location.city}
											{station.location.region && ` - ${station.location.region.name}`}
										</p>
									</div>
								)}
							</div>
						</div>
						<div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
							{station.location && (
								<ShareButton
									title={`${station.operator?.name ?? "UKE"} - ${station.station_id}`}
									text={`${station.operator?.name ?? "UKE"} ${station.station_id} - ${station.location.city}`}
									url={`${window.location.origin}/#map=16/${station.location.latitude}/${station.location.longitude}?source=uke`}
									size="md"
								/>
							)}
							<button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
								<HugeiconsIcon icon={Cancel01Icon} className="size-5" />
							</button>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto custom-scrollbar">
					<div className="px-6 py-5">
						<h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t("specs.basicInfo")}</h3>

						<div className="rounded-xl border bg-muted/20 p-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{station.location && (
									<div className="flex items-center gap-2">
										<HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground shrink-0" />
										<span className="text-sm text-muted-foreground">{t("common:labels.coordinates")}</span>
										<span className="font-mono text-sm font-medium">
											{formatCoordinates(station.location.latitude, station.location.longitude, preferences.gpsFormat)}
										</span>
										<CopyButton text={`${station.location.latitude}, ${station.location.longitude}`} />
										{preferences.navLinksDisplay === "inline" && (
											<NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="inline" />
										)}
									</div>
								)}

								{station.location?.region && (
									<div className="flex items-center gap-2">
										<HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
										<span className="text-sm text-muted-foreground">{t("common:labels.region")}</span>
										<span className="text-sm font-medium">{station.location.region.name}</span>
									</div>
								)}

								{station.operator && (
									<div className="flex items-center gap-2">
										<HugeiconsIcon icon={Building02Icon} className="size-4 text-muted-foreground shrink-0" />
										<span className="text-sm text-muted-foreground">{t("common:labels.operator")}</span>
										<span className="text-sm font-medium">{station.operator.name}</span>
									</div>
								)}

								<div className="flex items-center gap-2">
									<HugeiconsIcon icon={Tag01Icon} className="size-4 text-muted-foreground shrink-0" />
									<span className="text-sm text-muted-foreground">{t("common:labels.stationId")}</span>
									<span className="font-mono text-sm font-medium">{station.station_id}</span>
									<CopyButton text={station.station_id} />
								</div>

								{station.location && preferences.navLinksDisplay === "buttons" && preferences.navigationApps.length > 0 && (
									<div className="sm:col-span-2 pt-3 border-t border-border/50">
										<NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="buttons" />
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="px-6 pb-5">
						<h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t("permits.title")}</h3>

						<div className="space-y-4">
							{Array.from(permitsByRat.entries()).map(([rat, permits]) => (
								<Collapsible key={rat} defaultOpen className="rounded-xl border overflow-hidden">
									<CollapsibleTrigger className="w-full px-4 py-2.5 bg-muted/30 border-b flex items-center gap-2 cursor-pointer">
										<HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
										<span className="font-bold text-sm">{rat}</span>
										<span className="text-xs text-muted-foreground">({t("permits.permitsCount", { count: permits.length })})</span>
										<HugeiconsIcon
											icon={ArrowDown01Icon}
											className={cn("size-3.5 ml-auto text-muted-foreground transition-transform in-data-open:rotate-180")}
										/>
									</CollapsibleTrigger>

									<CollapsibleContent>
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="border-b bg-muted/10">
														<th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
															{t("common:labels.band")}
														</th>
														<th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
															{t("permits.decisionNumber")}
														</th>
														<th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
															{t("permits.expiryDate")}
														</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-border/50">
													{permits.map((permit) => {
														const expiryDate = new Date(permit.expiry_date);
														const isExpired = isPermitExpired(permit.expiry_date);
														const neverExpires = expiryDate.getFullYear() >= 2099;

														return (
															<tr key={permit.id} className="hover:bg-muted/20 transition-colors">
																<td className="px-4 py-2.5 font-mono font-medium">
																	<div className="flex items-center gap-1.5">
																		<span>
																			{permit.band?.value
																				? Number(permit.band.value) === 0
																					? t("cells.unknownBand")
																					: `${permit.band.value} MHz`
																				: "-"}
																		</span>
																		{permit.band?.variant === "railway" && (
																			<Tooltip>
																				<TooltipTrigger>
																					<span className="inline-flex items-center justify-center size-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 cursor-help text-xs font-bold">
																						R
																					</span>
																				</TooltipTrigger>
																				<TooltipContent side="top">
																					<p>GSM-R</p>
																				</TooltipContent>
																			</Tooltip>
																		)}
																	</div>
																</td>
																<td className="px-4 py-2.5">
																	<div className="flex items-center gap-2">
																		<span className="font-mono text-xs">{permit.decision_number}</span>
																		<Tooltip>
																			<TooltipTrigger className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-bold uppercase cursor-help">
																				{permit.decision_type}
																			</TooltipTrigger>
																			<TooltipContent>
																				{permit.decision_type === "zmP" ? t("permits.decisionTypeZmP") : t("permits.decisionTypeP")}
																			</TooltipContent>
																		</Tooltip>
																	</div>
																</td>
																<td className="px-4 py-2.5">
																	{isExpired ? (
																		<div className="flex items-center gap-2">
																			<HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-destructive" />
																			<span className="text-destructive font-medium">{expiryDate.toLocaleDateString(i18n.language)}</span>
																			<span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[9px] font-bold uppercase">
																				{t("common:status.expired")}
																			</span>
																		</div>
																	) : (
																		<span>{neverExpires ? t("permits.neverExpires") : expiryDate.toLocaleDateString(i18n.language)}</span>
																	)}
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</CollapsibleContent>
								</Collapsible>
							))}
						</div>
					</div>
				</div>

				<div className="shrink-0 px-6 py-3 border-t bg-muted/20">
					<p className="text-xs text-muted-foreground text-center">{t("permits.sourceUke")}</p>
				</div>
			</div>
		</div>
	);
}
