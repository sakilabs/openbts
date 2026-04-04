import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function tryParseJson(val: string): unknown {
  if (!val.startsWith("{") && !val.startsWith("[")) return undefined;
  try {
    return JSON.parse(val);
  } catch {
    return undefined;
  }
}

function ObjectValue({
  value,
  compareWith,
  variant,
}: {
  value: Record<string, unknown>;
  compareWith?: Record<string, unknown>;
  variant?: "old" | "new";
}) {
  return (
    <div className="flex flex-col gap-1 pl-2 border-l-2 border-muted/50 my-1">
      {Object.entries(value).map(([k, v]) => {
        const fieldChanged = compareWith !== undefined && JSON.stringify(v) !== JSON.stringify(compareWith[k]);
        return (
          <div
            key={k}
            className={cn(
              "flex flex-col gap-0.5 rounded-sm px-1 -mx-1",
              fieldChanged && variant === "old" && "bg-red-500/10",
              fieldChanged && variant === "new" && "bg-emerald-500/10",
            )}
          >
            <span className="text-[10px] text-muted-foreground font-mono">{k}</span>
            <div className="pl-1">
              <Value value={v} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ObjectArrayValue({
  items,
  compareItems,
  variant,
}: {
  items: Record<string, unknown>[];
  compareItems?: Record<string, unknown>[];
  variant?: "old" | "new";
}) {
  return (
    <div className="flex flex-col gap-2 pl-2 border-l-2 border-muted/50 my-1">
      {items.map((item, index) => {
        const counterpart = compareItems?.[index];
        const itemChanged = counterpart !== undefined && JSON.stringify(item) !== JSON.stringify(counterpart);
        return (
          <div key={`object-${index}`} className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Item {index + 1}</span>
            <div className="pl-2 border-l border-muted/30">
              {Object.entries(item).map(([k, v]) => {
                const fieldChanged = itemChanged && counterpart !== undefined && JSON.stringify(v) !== JSON.stringify(counterpart[k]);
                return (
                  <div
                    key={k}
                    className={cn(
                      "flex gap-2 text-xs py-0.5 rounded-sm px-1 -mx-1",
                      fieldChanged && variant === "old" && "bg-red-500/10",
                      fieldChanged && variant === "new" && "bg-emerald-500/10",
                    )}
                  >
                    <span className="text-muted-foreground min-w-20 shrink-0 font-mono">{k}:</span>
                    <span className="break-all">
                      <Value value={v} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PrimitiveArrayValue({ items, compareItems, variant }: { items: unknown[]; compareItems?: unknown[]; variant?: "old" | "new" }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        const fieldChanged = compareItems !== undefined && JSON.stringify(item) !== JSON.stringify(compareItems[i]);
        return (
          <div
            key={`${String(item)}-${i}`}
            className={cn(
              "flex gap-2 rounded-sm px-1 -mx-1",
              fieldChanged && variant === "old" && "bg-red-500/10",
              fieldChanged && variant === "new" && "bg-emerald-500/10",
            )}
          >
            <span className="text-muted-foreground text-[10px] select-none min-w-4 text-right">{i + 1}.</span>
            <span className="break-all">
              <Value value={item} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

const nullPlaceholder = <span className="text-muted-foreground">-</span>;
const emptyArrayPlaceholder = <span className="text-muted-foreground">[]</span>;

function resolveValue(value: unknown): unknown {
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed !== undefined) return parsed;
  }
  return value;
}

function Value({ value, compareWith, variant }: { value: unknown; compareWith?: unknown; variant?: "old" | "new" }): React.ReactNode {
  if (value === null || value === undefined) return nullPlaceholder;

  if (Array.isArray(value)) {
    if (value.length === 0) return emptyArrayPlaceholder;
    const compareArr = Array.isArray(compareWith) ? compareWith : undefined;
    if (value.every((item) => isObject(item))) {
      return <ObjectArrayValue items={value} compareItems={compareArr as Record<string, unknown>[] | undefined} variant={variant} />;
    }
    return <PrimitiveArrayValue items={value} compareItems={compareArr} variant={variant} />;
  }

  if (isObject(value)) {
    return <ObjectValue value={value} compareWith={isObject(compareWith) ? compareWith : undefined} variant={variant} />;
  }

  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed !== undefined) return <Value value={parsed} compareWith={compareWith} variant={variant} />;
  }

  return String(value as string | number | boolean | bigint);
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
            const rawOld = oldValues?.[key];
            const rawNew = newValues?.[key];
            const resolvedOld = resolveValue(rawOld);
            const resolvedNew = resolveValue(rawNew);
            const changed = oldValues && newValues && JSON.stringify(rawOld) !== JSON.stringify(rawNew);
            const isComplex = Array.isArray(resolvedOld) || Array.isArray(resolvedNew) || isObject(resolvedOld) || isObject(resolvedNew);

            return (
              <tr key={key} className="border-b last:border-0 group hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-mono text-muted-foreground align-top font-medium break-all">{key}</td>
                {oldValues && (
                  <td className={cn("px-3 py-2 font-mono break-all align-top", changed && !isComplex && "bg-red-500/5")}>
                    <Value value={rawOld} compareWith={isComplex ? resolvedNew : undefined} variant="old" />
                  </td>
                )}
                {newValues && (
                  <td className={cn("px-3 py-2 font-mono break-all align-top", changed && !isComplex && "bg-emerald-500/5")}>
                    <Value value={rawNew} compareWith={isComplex ? resolvedOld : undefined} variant="new" />
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
