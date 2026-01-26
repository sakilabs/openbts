import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	DocumentCodeIcon,
	Calendar03Icon,
	Loading03Icon,
	AlertCircleIcon,
	Globe02Icon,
	Building02Icon,
	SignalFull02Icon,
} from "@hugeicons/core-free-icons";
import type { UkePermit } from "@/types/station";
import { fetchApiData } from "@/lib/api";

async function fetchPermits(stationId: number, isUkeSource: boolean): Promise<UkePermit[]> {
	if (isUkeSource) {
		const permit = await fetchApiData<UkePermit>(`uke/permits/${stationId}`);
		return permit ? [permit] : [];
	}

	const permits = await fetchApiData<UkePermit[]>(`stations/${stationId}/permits`, {
		allowedErrors: [404],
	});
	return permits ?? [];
}

type PermitsListProps = {
	stationId: number;
	isUkeSource?: boolean;
};

export function PermitsList({ stationId, isUkeSource = false }: PermitsListProps) {
	const { t, i18n } = useTranslation("stationDetails");
	const {
		data: permits = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["station-permits", stationId, isUkeSource],
		queryFn: () => fetchPermits(stationId, isUkeSource),
		enabled: !!stationId,
		staleTime: 1000 * 60 * 10,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-10">
				<HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground px-4">
				<div className="size-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive/50 mb-3">
					<HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
				</div>
				<p className="text-sm">{t("permits.loadError")}</p>
			</div>
		);
	}

	if (permits.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
				<HugeiconsIcon icon={DocumentCodeIcon} className="size-8 mb-2 opacity-20" />
				<p className="text-sm">{t("permits.noPermits")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{permits.map((permit) => (
				<div key={permit.id} className="p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={DocumentCodeIcon} className="size-4 text-primary" />
								<span className="font-mono font-bold text-sm">{permit.case_id}</span>
								{!permit.is_active && (
									<span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
										{t("permits.inactive")}
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								{permit.address}, {permit.city}
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							{permit.operator && (
								<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border text-[11px] font-medium">
									<HugeiconsIcon icon={Building02Icon} className="size-3 text-muted-foreground" />
									{permit.operator.name}
								</div>
							)}
							{permit.band && (
								<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border text-[11px] font-medium font-mono">
									<HugeiconsIcon icon={SignalFull02Icon} className="size-3 text-muted-foreground" />
									{permit.band.value} MHz
								</div>
							)}
						</div>
					</div>

					<div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
								<HugeiconsIcon icon={Globe02Icon} className="size-3.5" />
								{permit.latitude.toFixed(5)}, {permit.longitude.toFixed(5)}
							</div>
						</div>

						{permit.expiry_date && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
								{t("permits.expires")} {new Date(permit.expiry_date).toLocaleDateString(i18n.language)}
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
