import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { WifiConnected01Icon, BatteryLowIcon, AlertCircleIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { Cell } from "@/types/station";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { isRecent } from "@/lib/dateUtils";
import { RAT_ICONS } from "../utils";

type CellTableProps = {
  rat: string;
  cells: Cell[];
};

export function CellTable({ rat, cells }: CellTableProps) {
  const { t } = useTranslation(["stationDetails", "common"]);
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-xl overflow-hidden">
      <CollapsibleTrigger className={cn("w-full px-4 py-2.5 bg-muted/50 flex items-center gap-2 cursor-pointer", open && "border-b")}>
        <HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
        <span className="font-semibold text-sm">{rat}</span>
        <span className="text-xs text-muted-foreground">({t("stations:cells.cellsCount", { count: cells.length })})</span>
        <HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("common:labels.band")}</th>
                {rat !== "GSM" && <th className="px-4 py-2 text-left font-medium text-muted-foreground">Duplex</th>}
                {rat === "GSM" && (
                  <>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">LAC</span>
                        </TooltipTrigger>
                        <TooltipContent>Local Area Code</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">CID</span>
                        </TooltipTrigger>
                        <TooltipContent>Cell ID</TooltipContent>
                      </Tooltip>
                    </th>
                  </>
                )}
                {rat === "UMTS" && (
                  <>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">LAC</span>
                        </TooltipTrigger>
                        <TooltipContent>Local Area Code</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">RNC</span>
                        </TooltipTrigger>
                        <TooltipContent>Radio Network Controller</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">CID</span>
                        </TooltipTrigger>
                        <TooltipContent>Cell ID</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">LongCID</span>
                        </TooltipTrigger>
                        <TooltipContent>Long Cell ID ((RNC * 65536) + CID)</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">UARFCN</span>
                        </TooltipTrigger>
                        <TooltipContent>Absolute Radio Frequency Channel Number</TooltipContent>
                      </Tooltip>
                    </th>
                  </>
                )}
                {rat === "LTE" && (
                  <>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">TAC</span>
                        </TooltipTrigger>
                        <TooltipContent>Tracking Area Code</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">eNBID</span>
                        </TooltipTrigger>
                        <TooltipContent>eNodeB ID</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">CLID</span>
                        </TooltipTrigger>
                        <TooltipContent>Cell Local ID</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">E-CID</span>
                        </TooltipTrigger>
                        <TooltipContent>Enhanced CID ((eNBID * 256) + CLID)</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">PCI</span>
                        </TooltipTrigger>
                        <TooltipContent>Physical Cell ID</TooltipContent>
                      </Tooltip>
                    </th>
                  </>
                )}
                {rat === "NR" && (
                  <>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">TAC</span>
                        </TooltipTrigger>
                        <TooltipContent>Tracking Area Code</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">CLID</span>
                        </TooltipTrigger>
                        <TooltipContent>Cell Local ID</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">gNBID</span>
                        </TooltipTrigger>
                        <TooltipContent>gNodeB ID (22-32 bits)</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">NCI</span>
                        </TooltipTrigger>
                        <TooltipContent>NR Cell Identity</TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">PCI</span>
                        </TooltipTrigger>
                        <TooltipContent>Physical Cell ID</TooltipContent>
                      </Tooltip>
                    </th>
                  </>
                )}
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t("common:labels.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => {
                const isNew = isRecent(cell.createdAt);
                return (
                  <tr key={cell.id} className={cn("border-b last:border-0 hover:bg-muted/20")}>
                    <td className={cn("px-4 py-2 font-mono", isNew && "border-l-2 border-l-green-500")}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>{Number(cell.band.value) === 0 ? t("stations:cells.unknownBand") : `${cell.band.value} MHz`}</span>
                        {rat === "NR" && (cell.details?.type === "nsa" || cell.details?.type === "sa") && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                            {cell.details.type.toUpperCase()}
                          </Badge>
                        )}
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
                              <p>{t("stations:cells.cellNotConfirmed")}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    {rat !== "GSM" && <td className="px-4 py-2">{cell.band.duplex || "-"}</td>}
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
                        <td className="px-4 py-2 font-mono">{cell.details?.arfcn ?? "-"}</td>
                      </>
                    )}
                    {rat === "LTE" && (
                      <>
                        <td className="px-4 py-2 font-mono">{cell.details?.tac ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.enbid ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.clid ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.ecid ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.pci ?? "-"}</td>
                      </>
                    )}
                    {rat === "NR" && (
                      <>
                        <td className="px-4 py-2 font-mono">{cell.details?.nrtac ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.clid ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.gnbid ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.nci ?? "-"}</td>
                        <td className="px-4 py-2 font-mono">{cell.details?.pci ?? "-"}</td>
                      </>
                    )}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {cell.notes ? (
                          <Tooltip>
                            <TooltipTrigger render={<span className="text-muted-foreground truncate max-w-32 cursor-help" />}>
                              {cell.notes}
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-64">
                              {cell.notes}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {cell.details?.supports_nb_iot && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                            <HugeiconsIcon icon={WifiConnected01Icon} className="size-3" /> NB-IoT
                          </span>
                        )}
                        {cell.details?.supports_nr_redcap && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-[10px] font-medium">
                            <HugeiconsIcon icon={BatteryLowIcon} className="size-3" /> RedCap
                          </span>
                        )}
                        {isNew && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="secondary"
                                className="bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] px-1.5 py-0 cursor-help"
                              >
                                {t("common:submissionType.new")}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>{t("specs.newCellTooltip")}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
