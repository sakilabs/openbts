import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Station } from "@/types/station";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	InformationCircleIcon,
	Building02Icon,
	Calendar03Icon,
	Globe02Icon,
	Location01Icon,
	Note01Icon,
	RefreshIcon,
	SignalFull02Icon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CellTable } from "./cellTable";
import { RAT_ORDER } from "@/features/map/constants";
import { NetWorkSIds } from "./networkIds";
import { PermitsList } from "./permitsList";
import { CommentsList } from "./commentsList";
import { CopyButton } from "./copyButton";
import { NavigationLinks } from "./navLinks";
import { groupCellsByRat } from "../utils";
import { TAB_OPTIONS, type TabId } from "../tabs";
import { useSettings } from "@/hooks/useSettings";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";

type StationDetailsBodyProps = {
	stationId: number;
	source: "internal" | "uke";
	isLoading: boolean;
	error: unknown;
	station?: Station;
	activeTab: TabId;
	onTabChange: (tab: TabId) => void;
};

export function StationDetailsBody({ stationId, source, isLoading, error, station, activeTab, onTabChange }: StationDetailsBodyProps) {
	const { t } = useTranslation(["stationDetails", "common"]);
	const { i18n } = useTranslation();
	const { data: settings } = useSettings();
	const { preferences } = usePreferences();
	const cellGroups = station ? groupCellsByRat(station.cells) : {};
	const visibleTabs = useMemo(
		() =>
			source === "uke"
				? TAB_OPTIONS.filter((tab) => tab.id === "permits")
				: TAB_OPTIONS.filter((tab) => {
						if (tab.id === "comments" && !settings?.enableStationComments) return false;
						return true;
					}),
		[source, settings?.enableStationComments],
	);

	return (
		<div className="flex-1 overflow-y-auto custom-scrollbar">
			{isLoading ? (
				<div className="p-6 space-y-8">
					<div className="flex p-1 bg-muted/50 rounded-xl gap-1">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex-1 flex items-center justify-center gap-2 py-2 px-3">
								<Skeleton className="size-4 rounded" />
								<Skeleton className="h-4 w-16 rounded hidden sm:block" />
							</div>
						))}
					</div>
					<div className="space-y-4">
						<Skeleton className="h-4 w-32 rounded" />
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-xl">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="flex items-center gap-2">
									<Skeleton className="size-4 rounded shrink-0" />
									<Skeleton className="h-3 w-20 rounded" />
									<Skeleton className="h-3 w-24 rounded ml-auto" />
								</div>
							))}
						</div>
					</div>
					<div className="space-y-4">
						<Skeleton className="h-4 w-24 rounded" />
						{[1, 2].map((i) => (
							<div key={i} className="rounded-xl border overflow-hidden">
								<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
									<Skeleton className="size-4 rounded" />
									<Skeleton className="h-4 w-12 rounded" />
									<Skeleton className="h-3 w-16 rounded ml-auto" />
								</div>
								<div className="p-4 space-y-3">
									{[1, 2, 3].map((j) => (
										<div key={j} className="flex gap-4">
											<Skeleton className="h-4 w-20 rounded" />
											<Skeleton className="h-4 w-16 rounded" />
											<Skeleton className="h-4 w-32 rounded" />
											<Skeleton className="h-4 w-24 rounded" />
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			) : error ? (
				<div className="flex flex-col items-center justify-center py-20 text-center px-6">
					<div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
						<HugeiconsIcon icon={InformationCircleIcon} className="size-6" />
					</div>
					<p className="text-muted-foreground max-w-xs">{error instanceof Error ? error.message : t("common:placeholder.errorFetching")}</p>
				</div>
			) : station ? (
				<div className="p-6 space-y-8">
					<div className="flex p-1 bg-muted/50 rounded-xl gap-1">
						{visibleTabs.map((tab) => (
							<button
								type="button"
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={cn(
									"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
									activeTab === tab.id
										? "bg-background text-primary shadow-sm"
										: "text-muted-foreground hover:bg-background/50 hover:text-foreground",
								)}
							>
								<HugeiconsIcon icon={tab.icon} className="size-4" />
								<span className="hidden sm:inline">{t(`tabs.${tab.id}`)}</span>
							</button>
						))}
					</div>

					{source === "internal" ? (
						<>
							{activeTab === "specs" && (
								<div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
									<section>
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("specs.basicInfo")}</h3>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-xl bg-muted/20">
											<div className="flex items-center gap-2 flex-wrap">
												<HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground shrink-0" />
												<span className="text-sm text-muted-foreground whitespace-nowrap">{t("common:labels.coordinates")}:</span>
												<span className="text-sm font-mono font-medium break-all">
													{formatCoordinates(station.location.latitude, station.location.longitude, preferences.gpsFormat)}
												</span>
												<CopyButton text={`${station?.location.latitude}, ${station?.location.longitude}`} />
												{preferences.navLinksDisplay === "inline" && (
													<NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="inline" />
												)}
											</div>
											<div className="flex items-center gap-2">
												<HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
												<span className="text-sm text-muted-foreground">{t("common:labels.region")}:</span>
												<span className="text-sm font-medium">{station?.location.region?.name || "-"}</span>
											</div>
											<div className="flex items-center gap-2">
												<HugeiconsIcon icon={Building02Icon} className="size-4 text-muted-foreground shrink-0" />
												<span className="text-sm text-muted-foreground">{t("common:labels.operator")}:</span>
												<span className="text-sm font-medium">{station?.operator.name}</span>
											</div>
											<div className="flex items-center gap-2">
												<HugeiconsIcon icon={Tag01Icon} className="size-4 text-muted-foreground shrink-0" />
												<span className="text-sm text-muted-foreground">{t("common:labels.stationId")}:</span>
												<span className="text-sm font-mono font-medium">{station?.station_id}</span>
												<div className="ml-auto sm:ml-0">
													<CopyButton text={station?.station_id || ""} />
												</div>
											</div>
											{station?.networks && <NetWorkSIds networks={station.networks} />}
											{preferences.navLinksDisplay === "buttons" && preferences.navigationApps.length > 0 && (
												<div className="sm:col-span-2 pt-3 border-t border-border/50">
													<NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="buttons" />
												</div>
											)}
										</div>
									</section>

									<section>
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("specs.cellDetails")}</h3>
										{Object.keys(cellGroups).length === 0 ? (
											<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
												<HugeiconsIcon icon={SignalFull02Icon} className="size-8 mb-2 opacity-20" />
												<p className="text-sm">{t("stations:cells.noStationCells")}</p>
											</div>
										) : (
											<div className="space-y-4">
												{RAT_ORDER.filter((rat) => cellGroups[rat]).map((rat) => (
													<CellTable key={rat} rat={rat} cells={cellGroups[rat]} />
												))}
											</div>
										)}
									</section>

									{station?.notes && (
										<section>
											<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
												<HugeiconsIcon icon={Note01Icon} className="size-4" /> {t("specs.internalNotes")}
											</h3>
											<p className="text-sm p-4 border rounded-xl bg-muted/20">{station.notes}</p>
										</section>
									)}

									<section className="pt-4 border-t">
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<span className="inline-flex items-center gap-2">
												<HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
												{t("common:labels.created")}:{" "}
												{station
													? new Date(station.createdAt).toLocaleDateString(i18n.language, {
															year: "numeric",
															month: "long",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})
													: "-"}
											</span>
											<span className="inline-flex items-center gap-1.5">
												<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
												{t("common:labels.updated")}:{" "}
												{station
													? new Date(station.updatedAt).toLocaleDateString(i18n.language, {
															year: "numeric",
															month: "long",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})
													: "-"}
											</span>
										</div>
									</section>
								</div>
							)}

							{activeTab === "permits" && (
								<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
									<section>
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
											<HugeiconsIcon icon={Note01Icon} className="size-4" /> {t("tabs.permits")}
										</h3>
										<PermitsList stationId={stationId} />
									</section>
								</div>
							)}

							{activeTab === "comments" && (
								<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
									<section>
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
											<HugeiconsIcon icon={RefreshIcon} className="size-4" /> {t("comments.title")}
										</h3>
										<CommentsList stationId={stationId} />
									</section>
								</div>
							)}
						</>
					) : (
						<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
							<section>
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
									<HugeiconsIcon icon={Note01Icon} className="size-4" /> {t("tabs.permits")}
								</h3>
								<PermitsList stationId={stationId} isUkeSource />
							</section>
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
