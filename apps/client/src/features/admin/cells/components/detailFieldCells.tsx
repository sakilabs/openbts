import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DetailInputCellProps = {
  field: string;
  placeholder: string;
  value: number | "";
  error?: boolean;
  disabled?: boolean;
  onDetailChange: (field: string, value: number | boolean | undefined) => void;
};

export function DetailInputCell({ field, placeholder, value, error, disabled, onDetailChange }: DetailInputCellProps) {
  return (
    <td className="px-2 py-1">
      <Input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onDetailChange(field, e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
        className={cn("h-7 w-24 font-mono text-sm", error && "border-destructive")}
        disabled={disabled}
      />
    </td>
  );
}

export function DetailComputedCell({ value }: { value: number | null }) {
  return (
    <td className="px-2 py-1">
      <span className="font-mono text-sm text-muted-foreground">{value !== null ? value : "-"}</span>
    </td>
  );
}
