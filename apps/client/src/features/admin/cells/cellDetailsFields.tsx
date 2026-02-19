import { Checkbox } from "@/components/ui/checkbox";
import { DetailInputCell, DetailComputedCell } from "@/features/admin/cells/components/detailFieldCells";

type CellDetailsFieldsProps = {
  rat: string;
  bandValue?: number | null;
  details: Record<string, unknown>;
  detailErrors?: Record<string, string>;
  disabled?: boolean;
  onDetailChange: (field: string, value: number | boolean | undefined) => void;
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
          <td className="px-2 py-1">
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
          <td className="px-2 py-1">
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
      const nci = d.gnbid !== undefined && d.clid !== undefined ? (d.gnbid as number) * 4096 + (d.clid as number) : null;
      return (
        <>
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
          <td className="px-2 py-1">
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
