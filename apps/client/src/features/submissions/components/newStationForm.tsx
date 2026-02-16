import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon } from "@hugeicons/core-free-icons";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { operatorsQueryOptions } from "@/features/shared/queries";
import { getOperatorColor } from "@/lib/operatorUtils";
import type { ProposedStationForm } from "../types";
import type { StationErrors } from "../utils/validation";

type NewStationFormProps = {
  station: ProposedStationForm;
  errors?: StationErrors;
  onStationChange: (station: ProposedStationForm) => void;
};

export function NewStationForm({ station, errors, onStationChange }: NewStationFormProps) {
  const { t } = useTranslation("submissions");

  const { data: operators = [] } = useQuery(operatorsQueryOptions());

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
        <HugeiconsIcon icon={Building02Icon} className="size-4 text-primary" />
        <span className="font-semibold text-sm">{t("stationInfo.title")}</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="station_id" className="text-xs">
              {t("common:labels.stationId")}
            </Label>
            <Input
              id="station_id"
              placeholder="WWW12345"
              value={station.station_id}
              maxLength={16}
              onChange={(e) => onStationChange({ ...station, station_id: e.target.value })}
              className={`h-8 font-mono text-sm ${errors?.station_id ? "border-destructive" : ""}`}
            />
            {errors?.station_id ? (
              <p className="text-xs text-destructive">{t(errors.station_id)}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("stationInfo.stationIdHint")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="operator" className="text-xs">
              {t("common:labels.operator")}
            </Label>
            <Select
              value={station.operator_id?.toString() ?? ""}
              onValueChange={(value) =>
                onStationChange({
                  ...station,
                  operator_id: value ? Number.parseInt(value, 10) : null,
                })
              }
            >
              <SelectTrigger className={`h-8 text-sm ${errors?.operator_id ? "border-destructive" : ""}`}>
                <SelectValue>
                  {station.operator_id ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor: getOperatorColor(operators.find((o) => o.id === station.operator_id)?.mnc ?? 0),
                        }}
                      />
                      {operators.find((o) => o.id === station.operator_id)?.name}
                    </div>
                  ) : (
                    t("common:placeholder.selectOperator")
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(operator.mnc) }} />
                      {operator.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.operator_id && <p className="text-xs text-destructive">{t(errors.operator_id)}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">
            {t("common:labels.notes")}
          </Label>
          <Textarea
            id="notes"
            placeholder={t("common:placeholder.notes")}
            value={station.notes ?? ""}
            rows={2}
            onChange={(e) => onStationChange({ ...station, notes: e.target.value })}
            className="text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
