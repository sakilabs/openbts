import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function tryParseJson(val: string): unknown | undefined {
  if (!val.startsWith("{") && !val.startsWith("[")) return undefined;
  try {
    return JSON.parse(val);
  } catch {
    return undefined;
  }
}

function ObjectValue({ value }: { value: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-1 pl-2 border-l-2 border-muted/50 my-1">
      {Object.entries(value).map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground font-mono">{k}</span>
          <div className="pl-1">
            <Value value={v} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectArrayValue({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="flex flex-col gap-2 pl-2 border-l-2 border-muted/50 my-1">
      {items.map((item, index) => (
        <div key={`object-${item}`} className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">Item {index + 1}</span>
          <div className="pl-2 border-l border-muted/30">
            {Object.entries(item).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs py-0.5">
                <span className="text-muted-foreground min-w-20 shrink-0 font-mono">{k}:</span>
                <span className="break-all">
                  <Value value={v} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrimitiveArrayValue({ items }: { items: unknown[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => (
        <div key={`primitive-${Math.random().toString(20).substring(2, 6)}`} className="flex gap-2">
          <span className="text-muted-foreground text-[10px] select-none w-4 text-right">{i + 1}.</span>
          <span className="break-all">
            <Value value={item} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Value({ value }: { value: unknown }): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">[]</span>;
    if (value.every((item) => isObject(item))) return <ObjectArrayValue items={value} />;
    return <PrimitiveArrayValue items={value} />;
  }

  if (isObject(value)) return <ObjectValue value={value} />;

  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed !== undefined) return <Value value={parsed} />;
  }

  return String(value);
}

export function ChangesTable({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  const { t } = useTranslation(["admin"]);

  if (!oldValues && !newValues) {
    return <p className="text-muted-foreground text-xs italic">{t("auditLogs.detail.noChanges")}</p>;
  }

  const allKeys = [...new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])];

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-xs table-fixed">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-1/4">{t("auditLogs.detail.field")}</th>
            {oldValues && <th className="text-left px-3 py-2 font-medium text-red-400 w-[37.5%]">{t("auditLogs.detail.oldValues")}</th>}
            {newValues && <th className="text-left px-3 py-2 font-medium text-emerald-400 w-[37.5%]">{t("auditLogs.detail.newValues")}</th>}
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const oldVal = oldValues?.[key];
            const newVal = newValues?.[key];
            const changed = oldValues && newValues && JSON.stringify(oldVal) !== JSON.stringify(newVal);

            return (
              <tr key={key} className="border-b last:border-0 group hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-mono text-muted-foreground align-top font-medium break-all">{key}</td>
                {oldValues && (
                  <td className={cn("px-3 py-2 font-mono break-all align-top", changed && "bg-red-500/5")}>
                    <Value value={oldVal} />
                  </td>
                )}
                {newValues && (
                  <td className={cn("px-3 py-2 font-mono break-all align-top", changed && "bg-emerald-500/5")}>
                    <Value value={newVal} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
