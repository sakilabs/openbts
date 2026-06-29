import { createContext, startTransition, type ReactNode, useState, useMemo, useContext } from "react";

export type ChartType = "area" | "line" | "bar";
interface ChartTypeContext {
  type: ChartType;
  setType: (type: ChartType) => void;
}
const Context = createContext<ChartTypeContext | null>(null);

export function ChartTypeProvider({ children, initial = "area" }: { children: ReactNode; initial?: ChartType }) {
  const [type, setTypeRaw] = useState<ChartType>(initial);
  const value = useMemo<ChartTypeContext>(() => ({ type, setType: (type) => startTransition(() => setTypeRaw(type)) }), [type]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useChartType(): ChartTypeContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useChartType must be used within <ChartTypeProvider>");
  return ctx;
}
