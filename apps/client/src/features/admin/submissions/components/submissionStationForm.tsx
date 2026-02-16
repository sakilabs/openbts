import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getOperatorColor } from "@/lib/operatorUtils";
import { LocationPicker } from "@/features/submissions/components/locationPicker";
import type { ProposedLocationForm } from "@/features/submissions/types";
import type { Operator, Station } from "@/types/station";
import type { SubmissionDetail } from "@/features/admin/submissions/types";
import { ChangeBadge } from "./common";

type SubmissionStationFormProps = {
  submission: SubmissionDetail;
  stationForm: {
    station_id: string;
    operator_id: number | null;
    notes: string;
  };
  onStationFormChange: (patch: Partial<{ station_id: string; operator_id: number | null; notes: string }>) => void;
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
              <Select
                value={stationForm.operator_id !== null ? stationForm.operator_id.toString() : ""}
                onValueChange={(v) => onStationFormChange({ operator_id: v ? Number.parseInt(v, 10) : null })}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedOperator ? (
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc) }} />
                        {selectedOperator.name}
                      </div>
                    ) : (
                      t("common:placeholder.selectOperator")
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
                        {op.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {stationDiffs?.operator_id && currentOperator && <ChangeBadge label={t("diff.current")} current={currentOperator.name} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("common:labels.notes")}</Label>
            <Textarea value={stationForm.notes} onChange={(e) => onStationFormChange({ notes: e.target.value })} rows={3} disabled={isFormDisabled} />
            {stationDiffs?.notes && <ChangeBadge label={t("diff.current")} current={submission.station?.notes ?? "—"} />}
          </div>
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
