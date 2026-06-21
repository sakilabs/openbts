import { type ReactNode, Suspense, createContext, lazy, useContext, useMemo } from "react";

import type { StationSource } from "@/types/station";

import { useStationDialogStackState } from "./stationDialogStackState";

const StationDetailsDialogStack = lazy(() => import("./stationDetailsDialogStack").then((m) => ({ default: m.StationDetailsDialogStack })));

type StationDialogStackContextValue = {
  openStationDialog: (id: number, source: StationSource) => boolean;
};

const StationDialogStackContext = createContext<StationDialogStackContextValue | null>(null);

export function StationDialogStackProvider({ children }: { children: ReactNode }) {
  const stack = useStationDialogStackState();
  const contextValue = useMemo(() => ({ openStationDialog: stack.openStationDialog }), [stack.openStationDialog]);

  return (
    <StationDialogStackContext.Provider value={contextValue}>
      {children}
      {stack.dialogs.length > 0 ? (
        <Suspense fallback={null}>
          <StationDetailsDialogStack
            dialogs={stack.dialogs}
            onClose={stack.closeStationDialog}
            onCloseTop={stack.closeTopStationDialog}
            onFocus={stack.focusStationDialog}
            onRectChange={stack.updateStationDialogRect}
          />
        </Suspense>
      ) : null}
    </StationDialogStackContext.Provider>
  );
}

export function useStationDialogStack() {
  const context = useContext(StationDialogStackContext);
  if (context === null) throw new Error("useStationDialogStack must be used within StationDialogStackProvider");
  return context;
}
