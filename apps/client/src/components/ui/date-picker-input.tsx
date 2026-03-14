import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

export function DatePickerInput({ value, onChange, className }: Props) {
  const { i18n } = useTranslation();

  const month = value !== null ? String(value.getUTCMonth()) : "";
  const year = value !== null ? String(value.getUTCFullYear()) : "";

  const monthNames = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString(i18n.language, { month: "long" }));

  function handleMonth(m: string | null) {
    if (m === null) return;
    onChange(new Date(Date.UTC(Number(year) || CURRENT_YEAR, Number(m), 1)));
  }

  function handleYear(y: string | null) {
    if (y === null) return;
    onChange(new Date(Date.UTC(Number(y), Number(month) || 0, 1)));
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select value={month} onValueChange={handleMonth}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue>{month !== "" ? monthNames[Number(month)] : undefined}</SelectValue>
        </SelectTrigger>
        <SelectContent positionerClassName="z-300">
          {monthNames.map((name, i) => (
            <SelectItem key={i} value={String(i)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground shrink-0">/</span>
      <Select value={year} onValueChange={handleYear}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent positionerClassName="z-300">
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
