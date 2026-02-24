import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOP4_MNCS, getOperatorColor } from "@/lib/operatorUtils";
import type { Operator } from "@/types/station";

type OperatorSelectProps = {
  operators: Operator[];
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  className?: string;
};

export function OperatorSelect({ operators, value, onChange, disabled, className }: OperatorSelectProps) {
  const { t } = useTranslation("common");

  const selectedOperator = operators.find((o) => o.id === value);

  const { topOperators, restOperators } = useMemo(
    () => ({
      topOperators: operators.filter((op) => TOP4_MNCS.includes(op.mnc)),
      restOperators: operators.filter((op) => !TOP4_MNCS.includes(op.mnc)),
    }),
    [operators],
  );

  return (
    <Select value={value !== null ? value.toString() : ""} onValueChange={(v) => onChange(v ? Number.parseInt(v, 10) : null)} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedOperator ? (
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc) }} />
              {selectedOperator.name}
            </div>
          ) : (
            t("placeholder.selectOperator")
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {topOperators.map((op) => (
          <SelectItem key={op.id} value={op.id.toString()}>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
              {op.name}
            </div>
          </SelectItem>
        ))}
        {topOperators.length > 0 && restOperators.length > 0 && <SelectSeparator />}
        {restOperators.map((op) => (
          <SelectItem key={op.id} value={op.id.toString()}>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
              {op.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
