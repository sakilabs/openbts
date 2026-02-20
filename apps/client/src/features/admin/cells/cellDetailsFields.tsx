import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DetailInputCell, DetailComputedCell } from "@/features/admin/cells/components/detailFieldCells";

const NR_TYPE_OPTIONS = [
  { value: "nsa", label: "NSA (Non-Standalone)" },
  { value: "sa", label: "SA (Standalone)" },
] as const;

type CellDetailsFieldsProps = {
  rat: string;
  bandValue?: number | null;
  details: Record<string, unknown>;
  detailErrors?: Record<string, string>;
  disabled?: boolean;
  onDetailChange: (field: string, value: number | boolean | string | undefined) => void;
};

export function CellDetailsFields({ rat, bandValue, details, detailErrors, disabled, onDetailChange }: CellDetailsFieldsProps) {
  const d = details;
  switch (rat) {
    case "GSM":
      return (
        <>
          <DetailInputCell
            field="lac"
            placeholder="LAC"
            value={(d.lac as number) ?? ""}
            error={!!detailErrors?.lac}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="cid"
            placeholder="CID"
            value={(d.cid as number) ?? ""}
            error={!!detailErrors?.cid}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <td className="px-1.5 py-1">
            <Checkbox
              checked={bandValue === 1800 ? false : ((d.e_gsm as boolean) ?? false)}
              onCheckedChange={(checked) => onDetailChange("e_gsm", checked === true)}
              disabled={disabled || (rat === "GSM" && bandValue === 1800)}
            />
          </td>
        </>
      );
    case "UMTS": {
      const longCid = d.rnc !== undefined && d.cid !== undefined ? (d.rnc as number) * 65536 + (d.cid as number) : null;
      return (
        <>
          <DetailInputCell
            field="lac"
            placeholder="LAC"
            value={(d.lac as number) ?? ""}
            error={!!detailErrors?.lac}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="rnc"
            placeholder="RNC"
            value={(d.rnc as number) ?? ""}
            error={!!detailErrors?.rnc}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="cid"
            placeholder="CID"
            value={(d.cid as number) ?? ""}
            error={!!detailErrors?.cid}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailComputedCell value={longCid} />
          <DetailInputCell
            field="carrier"
            placeholder="Carrier"
            value={(d.carrier as number) ?? ""}
            error={!!detailErrors?.carrier}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
        </>
      );
    }
    case "LTE": {
      const eCid = d.enbid !== undefined && d.clid !== undefined ? (d.enbid as number) * 256 + (d.clid as number) : null;
      return (
        <>
          <DetailInputCell
            field="tac"
            placeholder="TAC"
            value={(d.tac as number) ?? ""}
            error={!!detailErrors?.tac}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="enbid"
            placeholder="eNBID"
            value={(d.enbid as number) ?? ""}
            error={!!detailErrors?.enbid}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="clid"
            placeholder="CLID"
            value={(d.clid as number) ?? ""}
            error={!!detailErrors?.clid}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailComputedCell value={eCid} />
          <DetailInputCell
            field="pci"
            placeholder="PCI"
            value={(d.pci as number) ?? ""}
            error={!!detailErrors?.pci}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <td className="px-1.5 py-1">
            <Checkbox
              checked={(d.supports_nb_iot as boolean) ?? false}
              onCheckedChange={(checked) => onDetailChange("supports_nb_iot", checked === true)}
              disabled={disabled}
            />
          </td>
        </>
      );
    }
    case "NR": {
      const nrType = (d.type as "nsa" | "sa") ?? "nsa";
      const nrTypeLabel = NR_TYPE_OPTIONS.find((opt) => opt.value === nrType)?.label ?? "NSA";
      const nci = d.gnbid !== undefined && d.clid !== undefined ? (d.gnbid as number) * 4096 + (d.clid as number) : null;
      return (
        <>
          <td className="px-1.5 py-1">
            <Select value={nrType} onValueChange={(value) => onDetailChange("type", value as "nsa" | "sa")} disabled={disabled}>
              <SelectTrigger className={cn("h-7 w-18 text-sm", detailErrors?.type && "border-destructive")}>
                <SelectValue>{nrTypeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-48">
                {NR_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
          <DetailInputCell
            field="nrtac"
            placeholder="TAC"
            value={(d.nrtac as number) ?? ""}
            error={!!detailErrors?.nrtac}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="clid"
            placeholder="CLID"
            value={(d.clid as number) ?? ""}
            error={!!detailErrors?.clid}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailInputCell
            field="gnbid"
            placeholder="gNBID"
            value={(d.gnbid as number) ?? ""}
            error={!!detailErrors?.gnbid}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <DetailComputedCell value={nci} />
          <DetailInputCell
            field="pci"
            placeholder="PCI"
            value={(d.pci as number) ?? ""}
            error={!!detailErrors?.pci}
            disabled={disabled}
            onDetailChange={onDetailChange}
          />
          <td className="px-1.5 py-1">
            <Checkbox
              checked={(d.supports_nr_redcap as boolean) ?? false}
              onCheckedChange={(checked) => onDetailChange("supports_nr_redcap", checked === true)}
              disabled={disabled}
            />
          </td>
        </>
      );
    }
    default:
      return null;
  }
}
