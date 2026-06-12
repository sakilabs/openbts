import i18next from "i18next";

type PemPopupProps = {
  stationId: string | null;
  operatorName: string | null;
  color: string;
  dateFrom: string;
  dateTo: string;
  labName: string;
  labPca: string;
  city: string;
  address: string;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(i18next.language, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PemPopupContent({ stationId, operatorName, color, dateFrom, dateTo, labName, labPca, city, address }: PemPopupProps) {
  return (
    <div className="w-80 text-sm">
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-[2px] shrink-0" style={{ backgroundColor: color }} />
          <span className="font-medium text-[12px]">{operatorName ?? i18next.t("unknownOperator", { ns: "main" })}</span>
          {stationId && <span className="text-[11px] text-foreground/70">{stationId}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {city}
          {address ? ` · ${address}` : ""}
        </p>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <Row label={i18next.t("table.dateFrom", { ns: "pem" })} value={formatDate(dateFrom)} />
        <Row label={i18next.t("table.dateTo", { ns: "pem" })} value={formatDate(dateTo)} />
        <Row label={i18next.t("table.lab", { ns: "pem" })} value={`${labName} (${labPca})`} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium truncate">{value}</span>
    </div>
  );
}
