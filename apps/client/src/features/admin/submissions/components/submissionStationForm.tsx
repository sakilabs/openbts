import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OperatorSelect } from "@/components/operator-select";
import { cn } from "@/lib/utils";
import { NETWORKS_ID_MNCS } from "@/lib/operatorUtils";
import { LocationPicker } from "@/features/submissions/components/locationPicker";
import type { ProposedLocationForm } from "@/features/submissions/types";
import type { Operator, Station } from "@/types/station";
import type { SubmissionDetail } from "@/features/admin/submissions/types";
import { ChangeBadge } from "./common";

type NetworksForm = {
  networks_id: number | null;
  networks_name: string;
  mno_name: string;
};

type SubmissionStationFormProps = {
  submission: SubmissionDetail;
  stationForm: {
    station_id: string;
    operator_id: number | null;
    notes: string;
  };
  onStationFormChange: (patch: Partial<{ station_id: string; operator_id: number | null; notes: string }>) => void;
  networksForm: NetworksForm;
  onNetworksFormChange: (patch: Partial<NetworksForm>) => void;
  locationForm: ProposedLocationForm;
  onLocationFormChange: (patch: Partial<ProposedLocationForm>) => void;
  operators: Operator[];
  selectedOperator?: Operator;
  currentOperator?: Operator | null;
  currentStation: Station | null;
  stationDiffs: { station_id: boolean; operator_id: boolean; notes: boolean } | null;
  locationDiffs: { coords: boolean; city: boolean; address: boolean } | null;
  isFormDisabled: boolean;
  isDeleteSubmission: boolean;
};

export function SubmissionStationForm({
  submission,
  stationForm,
  onStationFormChange,
  networksForm,
  onNetworksFormChange,
  locationForm,
  onLocationFormChange,
  operators,
  selectedOperator,
  currentOperator,
  currentStation,
  stationDiffs,
  locationDiffs,
  isFormDisabled,
  isDeleteSubmission,
}: SubmissionStationFormProps) {
  const { t } = useTranslation(["submissions", "common"]);
  const showNetworksId = selectedOperator ? NETWORKS_ID_MNCS.includes(selectedOperator.mnc) : !!networksForm.networks_id;

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={AirportTowerIcon} className="size-4 text-primary" />
            <span className="font-semibold text-sm">{t("stationInfo.title")}</span>
          </div>
        </div>
        <div className="px-4 py-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("common:labels.stationId")}</Label>
              <Input
                value={stationForm.station_id}
                onChange={(e) => onStationFormChange({ station_id: e.target.value })}
                maxLength={16}
                disabled={isFormDisabled}
              />
              {stationDiffs?.station_id && <ChangeBadge label={t("diff.current")} current={submission.station?.station_id as string} />}
            </div>
            <div className="space-y-2">
              <Label>{t("common:labels.operator")}</Label>
              <OperatorSelect
                operators={operators}
                value={stationForm.operator_id}
                onChange={(v) => onStationFormChange({ operator_id: v })}
                disabled={isFormDisabled}
              />
              {stationDiffs?.operator_id && currentOperator && <ChangeBadge label={t("diff.current")} current={currentOperator.name} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("common:labels.notes")}</Label>
            <Textarea value={stationForm.notes} onChange={(e) => onStationFormChange({ notes: e.target.value })} rows={3} disabled={isFormDisabled} />
            {stationDiffs?.notes && <ChangeBadge label={t("diff.current")} current={submission.station?.notes ?? "-"} />}
          </div>

          {showNetworksId && (
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Globe02Icon} className="size-4 text-primary" />
                <span className="font-semibold text-sm">NetWorkS! ID</span>
              </div>
              {isFormDisabled ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">{t("common:labels.networksId")}</span>
                    <p className="font-mono font-medium">{networksForm.networks_id ?? "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">{t("common:labels.networksName")}</span>
                    <p className="font-medium">{networksForm.networks_name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">{t("common:labels.mnoName")}</span>
                    <p className="font-medium">{networksForm.mno_name || "-"}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("common:labels.networksId")}</Label>
                      <Input
                        type="number"
                        value={networksForm.networks_id ?? ""}
                        placeholder="e.g. 12345"
                        onChange={(e) => onNetworksFormChange({ networks_id: e.target.value ? Number(e.target.value) : null })}
                        className="font-mono"
                      />
                      {currentStation?.networks?.networks_id !== undefined && networksForm.networks_id !== currentStation.networks.networks_id && (
                        <ChangeBadge label={t("diff.current")} current={String(currentStation.networks.networks_id ?? "-")} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("common:labels.networksName")}</Label>
                      <Input
                        value={networksForm.networks_name}
                        maxLength={50}
                        placeholder={t("common:placeholder.optional")}
                        onChange={(e) => onNetworksFormChange({ networks_name: e.target.value })}
                      />
                      {currentStation?.networks?.networks_name !== undefined &&
                        networksForm.networks_name !== (currentStation.networks.networks_name ?? "") && (
                          <ChangeBadge label={t("diff.current")} current={currentStation.networks.networks_name ?? "-"} />
                        )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common:labels.mnoName")}</Label>
                    <Input
                      value={networksForm.mno_name}
                      maxLength={50}
                      placeholder={t("common:placeholder.optional")}
                      onChange={(e) => onNetworksFormChange({ mno_name: e.target.value })}
                    />
                    {currentStation?.networks?.mno_name !== undefined && networksForm.mno_name !== (currentStation.networks.mno_name ?? "") && (
                      <ChangeBadge label={t("diff.current")} current={currentStation.networks.mno_name ?? "-"} />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {(!isDeleteSubmission || (locationForm.latitude !== null && locationForm.longitude !== null)) && (
        <div className={cn(isFormDisabled && "pointer-events-none opacity-60")}>
          <LocationPicker
            location={locationForm}
            onLocationChange={(patch) => !isFormDisabled && onLocationFormChange(patch)}
            locationDiffs={locationDiffs}
            currentLocation={currentStation?.location ?? null}
          />
        </div>
      )}
    </>
  );
}
