import { useTranslation } from "react-i18next";

import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";

export function GranularitySelect({ value, onChange }: { value: "daily" | "monthly"; onChange: (granularity: "daily" | "monthly") => void }) {
  const { t } = useTranslation("statistics");
  const items = [
    { value: "monthly", label: t("filters.monthly") },
    { value: "daily", label: t("filters.daily") },
  ];
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "daily" | "monthly")} items={items}>
      <SelectTrigger className="h-8 w-28">
        <SelectValue>{t(`filters.${value}`)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="monthly">{t("filters.monthly")}</SelectItem>
        <SelectItem value="daily">{t("filters.daily")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
