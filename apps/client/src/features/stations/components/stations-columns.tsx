import { memo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { SignalFull02Icon, Wifi01Icon, SmartPhone01Icon, FlashIcon, MapPinIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Station } from "@/types/station";
import { getOperatorColor } from "@/lib/operator-utils";
import { formatRelativeTime, formatFullDate } from "@/lib/format";

const RAT_CONFIG = {
	GSM: { icon: SignalFull02Icon, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "2G" },
	UMTS: { icon: Wifi01Icon, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "3G" },
	LTE: { icon: SmartPhone01Icon, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "4G" },
	NR: { icon: FlashIcon, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "5G" },
} as const;

const RAT_ORDER = ["GSM", "UMTS", "LTE", "NR"] as const;

const TechBadge = memo(({ rat }: { rat: keyof typeof RAT_CONFIG }) => {
	const config = RAT_CONFIG[rat];
	return (
		<span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${config.color}`}>
			<HugeiconsIcon icon={config.icon} className="size-3" />
			{config.label}
		</span>
	);
});

const BandBadge = memo(({ band }: { band: string }) => (
	<Badge variant="secondary" className="text-xs font-mono px-1.5 py-0">
		{band}
	</Badge>
));

type CreateColumnsOptions = {
	t: TFunction;
	tCommon: TFunction;
	locale: string;
	isSearchActive?: boolean;
};

export function createStationsColumns({ t, tCommon, locale, isSearchActive = false }: CreateColumnsOptions): ColumnDef<Station>[] {
	const columns: ColumnDef<Station>[] = [
		{
			accessorKey: "station_id",
			header: t("table.stationId"),
			size: 80,
			cell: ({ getValue }) => <span className="font-mono text-sm text-muted-foreground pl-2">{getValue<string>()}</span>,
		},
		{
			accessorKey: "operator",
			header: t("table.operator"),
			size: 160,
			cell: ({ row: { original: s } }) => {
				if (!s.operator) return <span className="text-muted-foreground">-</span>;
				return (
					<div className="flex items-start gap-2">
						<div className="size-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: getOperatorColor(s.operator.mnc) }} />
						<div className="flex flex-col">
							<span className="font-medium">{s.operator.name}</span>
							{s.operator.full_name !== s.operator.name && (
								<span className="text-xs text-muted-foreground truncate max-w-40">{s.operator.full_name}</span>
							)}
						</div>
					</div>
				);
			},
		},
		{
			id: "technologies",
			header: t("table.technologies"),
			size: 140,
			accessorFn: (station) => {
				if (!station.cells || !Array.isArray(station.cells)) return [];
				const rats = new Set(station.cells.filter((c) => c.rat).map((c) => c.rat.toUpperCase()));
				return RAT_ORDER.filter((rat) => rats.has(rat));
			},
			cell: ({ getValue }) => (
				<div className="flex items-center gap-1 flex-wrap">
					{getValue<(keyof typeof RAT_CONFIG)[]>().map((rat) => (
						<TechBadge key={rat} rat={rat} />
					))}
				</div>
			),
		},
		...(isSearchActive
			? []
			: ([
					{
						id: "bands" as const,
						header: t("table.bands"),
						size: 160,
						accessorFn: (station: Station) => {
							if (!station.cells || !Array.isArray(station.cells)) return [];
							const bands = new Set(station.cells.filter((c) => c.band?.value).map((c) => `${c.band.value}`));
							return Array.from(bands).sort((a, b) => Number(a) - Number(b));
						},
						cell: ({ getValue }) => {
							const bands = getValue<string[]>();
							if (bands.length === 0) return <span className="text-muted-foreground">-</span>;
							const displayBands = bands.slice(0, 4);
							const hiddenBands = bands.slice(4);
							return (
								<div className="flex items-center gap-1 flex-wrap">
									{displayBands.map((band) => (
										<BandBadge key={band} band={band} />
									))}
									{hiddenBands.length > 0 && (
										<Tooltip>
											<TooltipTrigger className="text-xs text-muted-foreground cursor-default">+{hiddenBands.length}</TooltipTrigger>
											<TooltipContent>
												<p>{hiddenBands.join(", ")}</p>
											</TooltipContent>
										</Tooltip>
									)}
								</div>
							);
						},
					},
				] as ColumnDef<Station>[])),
		{
			id: "location",
			header: t("table.location"),
			size: 280,
			accessorFn: (s) => s.location,
			cell: ({ getValue }) => {
				const location = getValue<Station["location"]>();
				if (!location) return <span className="text-muted-foreground">-</span>;
				return (
					<div className="flex items-start gap-2 overflow-hidden">
						<HugeiconsIcon icon={MapPinIcon} className="size-4 text-muted-foreground shrink-0 mt-0.5" />
						<div className="flex flex-col min-w-0 overflow-hidden">
							<span className="font-medium truncate">{location.city}</span>
							<span className="text-xs text-muted-foreground truncate">{location.address}</span>
						</div>
					</div>
				);
			},
		},
		{
			id: "region",
			header: t("table.region"),
			size: 100,
			accessorFn: (s) => s.location?.region?.name,
			cell: ({ getValue }) => {
				const value = getValue<string | undefined>();
				return <span className="text-muted-foreground">{value || "-"}</span>;
			},
		},
		{
			accessorKey: "updatedAt",
			header: t("table.updatedAt"),
			size: 140,
			cell: ({ getValue }) => {
				const date = getValue<string>();
				return (
					<Tooltip>
						<TooltipTrigger className="text-muted-foreground cursor-default">{formatRelativeTime(date, tCommon)}</TooltipTrigger>
						<TooltipContent>
							<p>{formatFullDate(date, locale)}</p>
						</TooltipContent>
					</Tooltip>
				);
			},
		},
	];

	return columns;
}
