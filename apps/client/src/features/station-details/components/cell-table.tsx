import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { WifiConnected01Icon, BatteryLowIcon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import type { Cell } from "@/types/station";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RAT_ICONS } from "../utils";

type CellTableProps = {
	rat: string;
	cells: Cell[];
};

export function CellTable({ rat, cells }: CellTableProps) {
	const { t } = useTranslation("stationDetails");

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
				<HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
				<span className="font-semibold text-sm">{rat}</span>
				<span className="text-xs text-muted-foreground ml-1">({t("cells.cell", { count: cells.length })})</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/30">
							<th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("cells.band")}</th>
							<th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("cells.duplex")}</th>
							{rat === "GSM" && (
								<>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">LAC</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">CID</th>
								</>
							)}
							{rat === "UMTS" && (
								<>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">LAC</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">RNC</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">CID</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">LongCID</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">Carrier</th>
								</>
							)}
							{rat === "LTE" && (
								<>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">TAC</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">eNBID</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">CLID</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">E-CID</th>
								</>
							)}
							{rat === "NR" && (
								<>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">TAC</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">gNBID</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">NCI</th>
								</>
							)}
							<th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("cells.notes")}</th>
						</tr>
					</thead>
					<tbody>
						{cells.map((cell) => (
							<tr key={cell.id} className="border-b last:border-0 hover:bg-muted/20">
<td className="px-4 py-2 font-mono">
											<div className="flex items-center gap-1.5">
												<span>{cell.band.value} MHz</span>
												{rat === "GSM" && cell.details?.e_gsm && (
													<Tooltip>
														<TooltipTrigger>
															<span className="inline-flex items-center justify-center size-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 cursor-help text-xs font-bold">
																E
															</span>
														</TooltipTrigger>
														<TooltipContent side="top">
															<p>E-GSM</p>
														</TooltipContent>
													</Tooltip>
												)}
												{!cell.is_confirmed && (
													<Tooltip>
														<TooltipTrigger>
															<span className="inline-flex items-center justify-center size-5 rounded-md bg-destructive/10 text-destructive cursor-help">
																<HugeiconsIcon icon={AlertCircleIcon} className="size-3.5" />
															</span>
														</TooltipTrigger>
														<TooltipContent side="top">
															<p>{t("cells.cellNotConfirmed")}</p>
														</TooltipContent>
													</Tooltip>
												)}
											</div>
										</td>
								<td className="px-4 py-2">{cell.band.duplex || "-"}</td>
								{rat === "GSM" && (
									<>
										<td className="px-4 py-2 font-mono">{cell.details?.lac ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.cid ?? "-"}</td>
									</>
								)}
								{rat === "UMTS" && (
									<>
										<td className="px-4 py-2 font-mono">{cell.details?.lac ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.rnc ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.cid ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.cid_long ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.carrier ?? "-"}</td>
									</>
								)}
								{rat === "LTE" && (
									<>
										<td className="px-4 py-2 font-mono">{cell.details?.tac ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.enbid ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.clid ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.ecid ?? "-"}</td>
									</>
								)}
								{rat === "NR" && (
									<>
										<td className="px-4 py-2 font-mono">{cell.details?.tac ?? cell.details?.nrtac ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.gnbid ?? "-"}</td>
										<td className="px-4 py-2 font-mono">{cell.details?.nci ?? "-"}</td>
									</>
								)}
								<td className="px-4 py-2 text-muted-foreground">{cell.notes || "-"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{(rat === "LTE" || rat === "NR") && cells.some((c) => c.details?.supports_nb_iot || c.details?.supports_nr_redcap) && (
				<div className="px-4 py-2 border-t bg-muted/30 flex flex-wrap gap-1.5">
					{cells.some((c) => c.details?.supports_nb_iot) && (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
							<HugeiconsIcon icon={WifiConnected01Icon} className="size-3" /> {t("cells.nbIot")}
						</span>
					)}
					{cells.some((c) => c.details?.supports_nr_redcap) && (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-xs font-medium">
							<HugeiconsIcon icon={BatteryLowIcon} className="size-3" /> {t("cells.redCap")}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
