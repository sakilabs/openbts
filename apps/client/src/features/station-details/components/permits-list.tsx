import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { DocumentCodeIcon, Calendar03Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { UkePermit } from "@/types/station";
import { fetchApiData } from "@/lib/api";
import { isPermitExpired } from "@/lib/date-utils";
import { RAT_ICONS } from "../utils";

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

function groupPermitsByRat(permits: UkePermit[]): Map<string, UkePermit[]> {
	const groups = new Map<string, UkePermit[]>();

	for (const permit of permits) {
		const rat = permit.band?.rat?.toUpperCase() || "OTHER";
		const existing = groups.get(rat) ?? [];
		existing.push(permit);
		groups.set(rat, existing);
	}

	for (const [_, groupPermits] of groups) {
		groupPermits.sort((a, b) => {
			const valA = Number(a.band?.value ?? 0);
			const valB = Number(b.band?.value ?? 0);
			return valA - valB;
		});
	}

	const ratOrder = ["GSM", "UMTS", "LTE", "NR", "CDMA", "IOT", "OTHER"];
	const sorted = new Map<string, UkePermit[]>();
	for (const rat of ratOrder) {
		if (groups.has(rat)) {
			const groupGet = groups.get(rat);
			if (groupGet) sorted.set(rat, groupGet);
		}
	}

	return sorted;
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

	const permitsByRat = useMemo(() => groupPermitsByRat(permits), [permits]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[1, 2].map((i) => (
					<div key={i} className="rounded-xl border overflow-hidden">
						<div className="px-4 py-2.5 bg-muted/30 border-b flex items-center gap-2">
							<Skeleton className="size-4 rounded" />
							<Skeleton className="h-4 w-12 rounded" />
							<Skeleton className="h-3 w-16 rounded ml-auto" />
						</div>
						<div className="overflow-x-auto">
							<div className="w-full">
								<div className="flex border-b bg-muted/10 px-4 py-2">
									<Skeleton className="h-3 w-16 rounded mr-8" />
									<Skeleton className="h-3 w-24 rounded mr-8" />
									<Skeleton className="h-3 w-20 rounded" />
								</div>
								{[1, 2, 3].map((j) => (
									<div key={j} className="flex px-4 py-2.5 border-b last:border-0">
										<Skeleton className="h-4 w-20 rounded mr-8" />
										<Skeleton className="h-4 w-32 rounded mr-8" />
										<Skeleton className="h-4 w-24 rounded" />
									</div>
								))}
							</div>
						</div>
					</div>
				))}
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
			{Array.from(permitsByRat.entries()).map(([rat, ratPermits]) => (
				<div key={rat} className="rounded-xl border overflow-hidden">
					<div className="px-4 py-2.5 bg-muted/30 border-b flex items-center gap-2">
						<HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-muted-foreground" />
						<span className="font-bold text-sm">{rat}</span>
						<span className="text-xs text-muted-foreground">({t("permits.permitsCount", { count: ratPermits.length })})</span>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/10">
									<th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("cells.band")}</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										{t("permits.decisionNumber")}
									</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
										{t("permits.expiryDate")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{ratPermits.map((permit) => {
									const expiryDate = new Date(permit.expiry_date);
									const isExpired = isPermitExpired(permit.expiry_date);
									const neverExpires = expiryDate.getFullYear() >= 2099;

									return (
										<tr key={permit.id} className="hover:bg-muted/20 transition-colors">
											<td className="px-4 py-2.5 font-mono font-medium">{permit.band?.value ? `${permit.band.value} MHz` : "-"}</td>
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
															{t("permits.expired")}
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
				</div>
			))}
		</div>
	);
}
