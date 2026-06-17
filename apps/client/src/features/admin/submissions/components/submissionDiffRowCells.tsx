import { Checkbox } from "@/components/ui/checkbox";
import { getRatDetailFields, type RatDetailField } from "@/features/shared/ratCellFields";
import { calculateComputedValues } from "@/features/shared/ratComputedValues";
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
  const fields = getRatDetailFields(rat);
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map((field) => (
        <DiffDetailCell key={field.key} field={field} details={d} changed={changed(field.key)} />
      ))}
    </>
  );
}

function getDiffFieldValue(field: RatDetailField, details: Record<string, unknown>): unknown {
  if (field.computed) return calculateComputedValues(field.computed, details);
  return details[field.key];
}

function DiffDetailCell({ field, details, changed }: { field: RatDetailField; details: Record<string, unknown>; changed?: boolean }) {
  const isComputed = field.kind === "computed";
  return (
    <td className={cn(cellClassName, !isComputed && changed && "bg-amber-400/10")}>
      <DiffOldValueCell value={getDiffFieldValue(field, details)} changed={!isComputed && changed} />
    </td>
  );
}
