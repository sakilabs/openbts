import { Checkbox } from "@/components/ui/checkbox";
import { calculateComputedValues } from "@/features/admin/cells/calculateComputedValues";
import { cn } from "@/lib/utils";

const cellClassName = "px-2 py-1 font-mono text-xs text-muted-foreground";

function DiffOldValueCell({ value, changed }: { value: unknown; changed?: boolean }) {
  const content = (() => {
    if (value === undefined || value === null) return <span className="text-muted-foreground/40">-</span>;
    if (typeof value === "boolean")
      return <Checkbox checked={value} disabled className="size-3 rounded-[3px] **:data-[slot=checkbox-indicator]:*:size-2.5" />;
    return <>{String(value as string | number)}</>;
  })();

  if (!changed) return content;
  return <span className="bg-amber-400/25 text-amber-700 dark:text-amber-300 rounded px-0.5">{content}</span>;
}

export function SubmissionDiffDetailCells({
  details,
  rat,
  changedKeys,
}: {
  details: Record<string, unknown>;
  rat: string;
  changedKeys?: Set<string>;
}) {
  const changed = (key: string) => changedKeys?.has(key);
  const d = details;
  switch (rat) {
    case "GSM":
      return (
        <>
          <td className={cn(cellClassName, changed("lac") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.lac} changed={changed("lac")} />
          </td>
          <td className={cn(cellClassName, changed("cid") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.cid} changed={changed("cid")} />
          </td>
          <td className={cn(cellClassName, changed("e_gsm") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.e_gsm} changed={changed("e_gsm")} />
          </td>
        </>
      );
    case "UMTS": {
      const longCid = calculateComputedValues("longCID", d);
      return (
        <>
          <td className={cn(cellClassName, changed("lac") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.lac} changed={changed("lac")} />
          </td>
          <td className={cn(cellClassName, changed("rnc") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.rnc} changed={changed("rnc")} />
          </td>
          <td className={cn(cellClassName, changed("cid") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.cid} changed={changed("cid")} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={longCid} />
          </td>
          <td className={cn(cellClassName, changed("arfcn") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.arfcn} changed={changed("arfcn")} />
          </td>
        </>
      );
    }
    case "LTE": {
      const eCid = calculateComputedValues("eCID", d);
      return (
        <>
          <td className={cn(cellClassName, changed("tac") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.tac} changed={changed("tac")} />
          </td>
          <td className={cn(cellClassName, changed("enbid") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.enbid} changed={changed("enbid")} />
          </td>
          <td className={cn(cellClassName, changed("clid") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.clid} changed={changed("clid")} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={eCid} />
          </td>
          <td className={cn(cellClassName, changed("pci") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.pci} changed={changed("pci")} />
          </td>
          <td className={cn(cellClassName, changed("earfcn") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.earfcn} changed={changed("earfcn")} />
          </td>
          <td className={cn(cellClassName, changed("supports_iot") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.supports_iot} changed={changed("supports_iot")} />
          </td>
        </>
      );
    }
    case "NR": {
      const nci = calculateComputedValues("nci", d);
      return (
        <>
          <td className={cn(cellClassName, changed("type") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.type} changed={changed("type")} />
          </td>
          <td className={cn(cellClassName, changed("nrtac") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.nrtac} changed={changed("nrtac")} />
          </td>
          <td className={cn(cellClassName, changed("clid") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.clid} changed={changed("clid")} />
          </td>
          <td className={cn(cellClassName, changed("gnbid") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.gnbid} changed={changed("gnbid")} />
          </td>
          <td className={cellClassName}>
            <DiffOldValueCell value={nci} />
          </td>
          <td className={cn(cellClassName, changed("pci") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.pci} changed={changed("pci")} />
          </td>
          <td className={cn(cellClassName, changed("arfcn") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.arfcn} changed={changed("arfcn")} />
          </td>
          <td className={cn(cellClassName, changed("supports_nr_redcap") && "bg-amber-400/10")}>
            <DiffOldValueCell value={d.supports_nr_redcap} changed={changed("supports_nr_redcap")} />
          </td>
        </>
      );
    }
    default:
      return null;
  }
}
