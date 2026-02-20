import { Checkbox } from "@/components/ui/checkbox";

const cellClassName = "px-2 py-1 font-mono text-xs text-muted-foreground";

function DiffOldValueCell({ value }: { value: unknown }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground/40">-</span>;
  if (typeof value === "boolean")
    return <Checkbox checked={value} disabled className="size-3 rounded-[3px] **:data-[slot=checkbox-indicator]:*:size-2.5" />;
  return <>{String(value)}</>;
}

function calculateServerValues(type: "longCID" | "eCID" | "nci", details: Record<string, unknown>) {
  switch (type) {
    case "longCID":
      {
        const isRNCPresent = details.rnc !== null && details.rnc !== undefined && details.rnc !== 0;
        const isCIDPresent = details.cid !== null && details.cid !== undefined && details.cid !== 0;
        if (isRNCPresent && isCIDPresent) return (details.rnc as number) * 65536 + (details.cid as number);
      }
      break;
    case "eCID":
      {
        const isENBIDPresent = details.enbid !== null && details.enbid !== undefined && details.enbid !== 0;
        const isCLIDPresent = details.clid !== null && details.clid !== undefined && details.clid !== 0;
        if (isENBIDPresent && isCLIDPresent) return (details.enbid as number) * 256 + (details.clid as number);
      }
      break;
    case "nci":
      {
        const isGNBIDPresent = details.gnbid !== null && details.gnbid !== undefined && details.gnbid !== 0;
        const isCLIDPresent = details.clid !== null && details.clid !== undefined && details.clid !== 0;
        if (isGNBIDPresent && isCLIDPresent) return (details.gnbid as number) * 4096 + (details.clid as number);
      }
      break;
  }

  return null;
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
      const longCid = calculateServerValues("longCID", d);
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
      const eCid = calculateServerValues("eCID", d);
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
      const nci = calculateServerValues("nci", d);
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
