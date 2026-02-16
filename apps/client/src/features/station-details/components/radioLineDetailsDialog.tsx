import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Wifi01Icon,
  Calendar03Icon,
  Location01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Link01Icon,
  LicenseIcon,
  RulerIcon,
  Satellite01Icon,
  SignalFull02Icon,
  FlashIcon,
  Building02Icon,
  Activity01Icon,
  Radio01Icon,
  HorizontalResizeIcon,
  Rotate01Icon,
  DashboardSpeed01Icon,
} from "@hugeicons/core-free-icons";
import { getOperatorColor, resolveOperatorMnc, normalizeOperatorName } from "@/lib/operatorUtils";
import { isPermitExpired } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";
import { CopyButton } from "./copyButton";
import { calculateDistance, formatDistance, formatBandwidth, formatFrequency } from "@/features/map/utils";
import type { RadioLine } from "@/types/station";

type RadioLineDetailsDialogProps = {
  radioLine: RadioLine;
  onClose: () => void;
};

function InfoRow({ icon, label, value, mono }: { icon?: typeof Cancel01Icon; label: string; value?: string | number | null; mono?: boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center gap-2">
      {icon && <HugeiconsIcon icon={icon} className="size-3.5 text-muted-foreground shrink-0" />}
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={cn("text-sm font-medium", mono && "font-mono")}>{value}</span>
    </div>
  );
}

export function RadioLineDetailsDialog({ radioLine, onClose }: RadioLineDetailsDialogProps) {
  const { t, i18n } = useTranslation(["main", "stationDetails", "common"]);
  const { preferences } = usePreferences();

  useEscapeKey(onClose, true);

  const mnc = resolveOperatorMnc(radioLine.operator?.mnc, radioLine.operator?.name);
  const operatorColor = mnc ? getOperatorColor(mnc) : "#3b82f6";
  const operatorName = radioLine.operator?.name ? normalizeOperatorName(radioLine.operator.name) : t("unknownOperator");
  const isExpired = radioLine.permit.expiry_date ? isPermitExpired(radioLine.permit.expiry_date) : false;

  const distance = calculateDistance(radioLine.tx.latitude, radioLine.tx.longitude, radioLine.rx.latitude, radioLine.rx.longitude);

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
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-bold tracking-tight truncate" style={{ color: operatorColor }}>
                    {normalizeOperatorName(operatorName)}
                  </h2>
                  <span className="text-sm text-muted-foreground font-mono font-medium shrink-0">#{radioLine.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Radio01Icon} className="size-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground/90">{formatFrequency(radioLine.link.freq)}</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <HugeiconsIcon icon={RulerIcon} className="size-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground/90">{formatDistance(distance)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
              <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
                  {t("radiolines.txSide")}
                </h3>
                <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm font-medium">
                      {formatCoordinates(radioLine.tx.latitude, radioLine.tx.longitude, preferences.gpsFormat)}
                    </span>
                    <CopyButton text={`${radioLine.tx.latitude}, ${radioLine.tx.longitude}`} />
                  </div>
                  <InfoRow icon={RulerIcon} label={t("radiolines.height")} value={`${radioLine.tx.height} m`} />
                  {radioLine.tx.antenna?.type?.name && (
                    <InfoRow icon={Satellite01Icon} label={t("radiolines.antennaType")} value={radioLine.tx.antenna.type.name} />
                  )}
                  {radioLine.tx.antenna?.gain && (
                    <InfoRow icon={SignalFull02Icon} label={t("radiolines.antennaGain")} value={`${radioLine.tx.antenna.gain} dBi`} mono />
                  )}
                  {radioLine.tx.antenna?.height && (
                    <InfoRow icon={RulerIcon} label={t("radiolines.antennaHeight")} value={`${radioLine.tx.antenna.height} m`} mono />
                  )}
                  {radioLine.tx.eirp && <InfoRow icon={FlashIcon} label={t("radiolines.eirp")} value={`${radioLine.tx.eirp} dBW`} mono />}
                  {radioLine.tx.transmitter?.type?.name && (
                    <InfoRow icon={Satellite01Icon} label={t("radiolines.transmitterType")} value={radioLine.tx.transmitter.type.name} />
                  )}
                  {radioLine.tx.transmitter?.type?.manufacturer?.name && (
                    <InfoRow icon={Building02Icon} label={t("radiolines.manufacturer")} value={radioLine.tx.transmitter.type.manufacturer.name} />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
                  {t("radiolines.rxSide")}
                </h3>
                <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm font-medium">
                      {formatCoordinates(radioLine.rx.latitude, radioLine.rx.longitude, preferences.gpsFormat)}
                    </span>
                    <CopyButton text={`${radioLine.rx.latitude}, ${radioLine.rx.longitude}`} />
                  </div>
                  <InfoRow icon={RulerIcon} label={t("radiolines.height")} value={`${radioLine.rx.height} m`} />
                  {radioLine.rx.type?.name && <InfoRow icon={Satellite01Icon} label={t("radiolines.receiverType")} value={radioLine.rx.type.name} />}
                  {radioLine.rx.gain !== null && (
                    <InfoRow icon={SignalFull02Icon} label={t("radiolines.antennaGain")} value={`${radioLine.rx.gain} dBi`} mono />
                  )}
                  {radioLine.rx.height_antenna !== null && (
                    <InfoRow icon={RulerIcon} label={t("radiolines.antennaHeight")} value={`${radioLine.rx.height_antenna} m`} mono />
                  )}
                  {radioLine.rx.noise_figure !== null && (
                    <InfoRow icon={Activity01Icon} label={t("radiolines.noiseFigure")} value={`${radioLine.rx.noise_figure} dB`} mono />
                  )}
                  {radioLine.rx.type?.manufacturer?.name && (
                    <InfoRow icon={Building02Icon} label={t("radiolines.manufacturer")} value={radioLine.rx.type.manufacturer.name} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HugeiconsIcon icon={Link01Icon} className="size-3.5" />
              {t("radiolines.linkParams")}
            </h3>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={Radio01Icon}
                  label={t("radiolines.frequency")}
                  value={`${radioLine.link.freq} MHz (${formatFrequency(radioLine.link.freq)})`}
                  mono
                />
                {radioLine.link.ch_width !== null && (
                  <InfoRow icon={HorizontalResizeIcon} label={t("radiolines.channelWidth")} value={`${radioLine.link.ch_width} MHz`} mono />
                )}
                {radioLine.link.polarization && (
                  <InfoRow icon={Rotate01Icon} label={t("radiolines.polarization")} value={radioLine.link.polarization} />
                )}
                {radioLine.link.modulation_type && (
                  <InfoRow icon={Activity01Icon} label={t("radiolines.modulation")} value={radioLine.link.modulation_type} />
                )}
                {radioLine.link.bandwidth && (
                  <InfoRow icon={DashboardSpeed01Icon} label={t("radiolines.bandwidth")} value={formatBandwidth(radioLine.link.bandwidth)} />
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HugeiconsIcon icon={LicenseIcon} className="size-3.5" />
              {t("stationDetails:permits.permit")}
            </h3>
            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/10">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t("stationDetails:permits.decisionNumber")}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t("stationDetails:permits.expiryDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{radioLine.permit.number || "-"}</span>
                          {radioLine.permit.decision_type && (
                            <Tooltip>
                              <TooltipTrigger className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-bold uppercase cursor-help">
                                {radioLine.permit.decision_type}
                              </TooltipTrigger>
                              <TooltipContent>
                                {radioLine.permit.decision_type === "zmP"
                                  ? t("stationDetails:permits.decisionTypeZmP")
                                  : t("stationDetails:permits.decisionTypeP")}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {isExpired ? (
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-destructive" />
                            <span className="text-destructive font-medium">
                              {new Date(radioLine.permit.expiry_date).toLocaleDateString(i18n.language)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[9px] font-bold uppercase">
                              {t("common:status.expired")}
                            </span>
                          </div>
                        ) : (
                          <span>{new Date(radioLine.permit.expiry_date).toLocaleDateString(i18n.language)}</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-6 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">{t("stationDetails:permits.sourceUke")}</p>
        </div>
      </div>
    </div>
  );
}
