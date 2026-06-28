import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type FloatingDialogEntry = {
  key: string;
  zIndex: number;
  onClose: () => void;
};

type FloatingDialogCoordinatorContextValue = {
  topDialogKey: string | null;
  getNextZIndex: () => number;
  isTopZIndex: (zIndex: number) => boolean;
  syncStackEntries: (owner: string, entries: FloatingDialogEntry[]) => void;
};

const FLOATING_DIALOG_Z_INDEX_BASE = 40;
const FloatingDialogCoordinatorContext = createContext<FloatingDialogCoordinatorContextValue | null>(null);

export function getFloatingDialogEntryKey(owner: string, key: string) {
  return `${owner}:${key}`;
}

function getTopEntry(entries: Map<string, FloatingDialogEntry>) {
  let topEntry: { entryKey: string; entry: FloatingDialogEntry } | null = null;
  for (const [entryKey, entry] of entries) {
    if (topEntry === null || entry.zIndex > topEntry.entry.zIndex) topEntry = { entryKey, entry };
  }
  return topEntry;
}

export function FloatingDialogCoordinatorProvider({ children }: { children: ReactNode }) {
  const nextZIndexRef = useRef(FLOATING_DIALOG_Z_INDEX_BASE);
  const entriesRef = useRef(new Map<string, FloatingDialogEntry>());
  const [topDialogKey, setTopDialogKey] = useState<string | null>(null);

  const syncTopDialogKey = useCallback(() => {
    const topEntry = getTopEntry(entriesRef.current);
    const nextTopDialogKey = topEntry?.entryKey ?? null;
    setTopDialogKey((current) => (current === nextTopDialogKey ? current : nextTopDialogKey));
  }, []);

  const getNextZIndex = useCallback(() => {
    nextZIndexRef.current += 1;
    return nextZIndexRef.current;
  }, []);

  const isTopZIndex = useCallback((zIndex: number) => getTopEntry(entriesRef.current)?.entry.zIndex === zIndex, []);

  const syncStackEntries = useCallback(
    (owner: string, entries: FloatingDialogEntry[]) => {
      const ownerPrefix = `${owner}:`;
      for (const entryKey of entriesRef.current.keys()) {
        if (entryKey.startsWith(ownerPrefix)) entriesRef.current.delete(entryKey);
      }
      for (const entry of entries) {
        entriesRef.current.set(getFloatingDialogEntryKey(owner, entry.key), entry);
      }
      syncTopDialogKey();
    },
    [syncTopDialogKey],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Escape") return;

      const topEntry = getTopEntry(entriesRef.current);
      if (topEntry === null) return;

      event.preventDefault();
      topEntry.entry.onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const contextValue = useMemo(
    () => ({
      topDialogKey,
      getNextZIndex,
      isTopZIndex,
      syncStackEntries,
    }),
    [getNextZIndex, isTopZIndex, syncStackEntries, topDialogKey],
  );

  return <FloatingDialogCoordinatorContext.Provider value={contextValue}>{children}</FloatingDialogCoordinatorContext.Provider>;
}

export function useFloatingDialogCoordinator() {
  const context = useContext(FloatingDialogCoordinatorContext);
  if (context === null) throw new Error("useFloatingDialogCoordinator must be used within FloatingDialogCoordinatorProvider");
  return context;
}
