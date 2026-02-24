import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OperatorSelect } from "@/components/operator-select";
import { NETWORKS_ID_MNCS } from "@/lib/operatorUtils";
import { LocationPicker } from "@/features/submissions/components/locationPicker";
import type { ProposedLocationForm } from "@/features/submissions/types";
import type { Operator, UkeStation, LocationWithStations } from "@/types/station";

type StationInfoFormProps = {
  stationId: string;
  onStationIdChange: (value: string) => void;
  operatorId: number | null;
  onOperatorIdChange: (value: number | null) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  extraAddress: string;
  onExtraAddressChange: (value: string) => void;
  isConfirmed: boolean;
  onIsConfirmedChange: (checked: boolean) => void;
  location: ProposedLocationForm;
  onLocationChange: (patch: Partial<ProposedLocationForm>) => void;
  onExistingLocationSelect?: (location: LocationWithStations) => void;
  operators: Operator[];
  selectedOperator?: Operator;
  onUkeStationSelect?: (station: UkeStation) => void;
  networksId?: number | null;
  onNetworksIdChange?: (value: number | null) => void;
  networksName?: string;
  onNetworksNameChange?: (value: string) => void;
  mnoName?: string;
  onMnoNameChange?: (value: string) => void;
};

export function StationInfoForm({
  stationId,
  onStationIdChange,
  operatorId,
  onOperatorIdChange,
  notes,
  onNotesChange,
  extraAddress,
  onExtraAddressChange,
  isConfirmed,
  onIsConfirmedChange,
  location,
  onLocationChange,
  onExistingLocationSelect,
  operators,
  selectedOperator,
  onUkeStationSelect,
  networksId,
  onNetworksIdChange,
  networksName,
  onNetworksNameChange,
  mnoName,
  onMnoNameChange,
}: StationInfoFormProps) {
  const { t } = useTranslation(["submissions", "common"]);

  const showNetworksId = selectedOperator ? NETWORKS_ID_MNCS.includes(selectedOperator.mnc) : false;

  return (
    <div className="space-y-3">
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={AirportTowerIcon} className="size-4 text-primary" />
          <span className="font-semibold text-sm">{t("stationInfo.title")}</span>
        </div>
        <div className="px-4 py-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("common:labels.stationId")}</Label>
              <Input value={stationId} onChange={(e) => onStationIdChange(e.target.value)} maxLength={16} />
            </div>
            <div className="space-y-2">
              <Label>{t("common:labels.operator")}</Label>
              <OperatorSelect operators={operators} value={operatorId} onChange={onOperatorIdChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("common:labels.notes")}</Label>
            <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>{t("common:labels.extraAddress")}</Label>
            <Input value={extraAddress} onChange={(e) => onExtraAddressChange(e.target.value)} placeholder={t("common:labels.address")} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={isConfirmed} onCheckedChange={(checked) => onIsConfirmedChange(checked === true)} />
            <Label>{t("common:labels.confirmed")}</Label>
          </div>

          {showNetworksId && (
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Globe02Icon} className="size-4 text-primary" />
                <span className="font-semibold text-sm">NetWorkS! ID</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("common:labels.networksId")}</Label>
                  <Input
                    type="number"
                    value={networksId ?? ""}
                    placeholder="e.g. 12345"
                    onChange={(e) => onNetworksIdChange?.(e.target.value ? Number(e.target.value) : null)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common:labels.networksName")}</Label>
                  <Input
                    value={networksName ?? ""}
                    maxLength={50}
                    placeholder={t("common:placeholder.optional")}
                    onChange={(e) => onNetworksNameChange?.(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("common:labels.mnoName")}</Label>
                <Input
                  value={mnoName ?? ""}
                  maxLength={50}
                  placeholder={t("common:placeholder.optional")}
                  onChange={(e) => onMnoNameChange?.(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <LocationPicker
        location={location}
        onLocationChange={onLocationChange}
        onExistingLocationSelect={onExistingLocationSelect}
        onUkeStationSelect={onUkeStationSelect}
      />
    </div>
  );
}
