import { Checkbox } from "@/components/ui/checkbox";
import { calculateComputedValues } from "@/features/admin/cells/calculateComputedValues";

const cellClassName = "px-2 py-1 font-mono text-xs text-muted-foreground";

function DiffOldValueCell({ value }: { value: unknown }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground/40">-</span>;
  if (typeof value === "boolean")
    return <Checkbox checked={value} disabled className="size-3 rounded-[3px] **:data-[slot=checkbox-indicator]:*:size-2.5" />;
  return <>{String(value)}</>;
}

export function SubmissionDiffDetailCells({ details, rat }: { details: Record<string, unknown>; rat: string }) {
  const d = details;
  switch (rat) {
    case "GSM":
      return (
        <>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.lac} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.cid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.e_gsm} />
          </td>
        </>
      );
    case "UMTS": {
      const longCid = calculateComputedValues("longCID", d);
      return (
        <>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.lac} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.rnc} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.cid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={longCid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.carrier} />
          </td>
        </>
      );
    }
    case "LTE": {
      const eCid = calculateComputedValues("eCID", d);
      return (
        <>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.tac} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.enbid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.clid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={eCid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.pci} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.supports_nb_iot} />
          </td>
        </>
      );
    }
    case "NR": {
      const nci = calculateComputedValues("nci", d);
      return (
        <>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.nrtac} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.gnbid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.clid} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={nci} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.pci} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={d.supports_nr_redcap} />
          </td>
        </>
      );
    }
    default:
      return null;
  }
}
