import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { pl, enUS } from "date-fns/locale";

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface DatePickerButtonProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

export function DatePickerButton({ value, onChange, label }: DatePickerButtonProps) {
  const { i18n } = useTranslation();
  const selected = value ? new Date(value) : undefined;
  const locale = i18n.language === "pl-PL" ? pl : enUS;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "h-8 rounded-lg border bg-transparent px-2.5 text-sm transition-colors flex items-center gap-2 min-w-32.5",
          "border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-muted",
          value ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{value || label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={(date) => onChange(date ? formatDateForInput(date) : "")} locale={locale} />
      </PopoverContent>
    </Popover>
  );
}
