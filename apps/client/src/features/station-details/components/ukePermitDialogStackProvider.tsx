import { type ReactNode, Suspense, createContext, lazy, useContext, useMemo } from "react";

import type { UkeStation } from "@/types/station";

import { useUkePermitDialogStackState } from "./ukePermitDialogStackState";

const UkePermitDialogStack = lazy(() => import("./ukePermitDialogStack").then((m) => ({ default: m.UkePermitDialogStack })));

type UkePermitDialogStackContextValue = {
  openUkePermitDialog: (station: UkeStation) => boolean;
};

const UkePermitDialogStackContext = createContext<UkePermitDialogStackContextValue | null>(null);

export function UkePermitDialogStackProvider({ children }: { children: ReactNode }) {
  const stack = useUkePermitDialogStackState();
  const contextValue = useMemo(() => ({ openUkePermitDialog: stack.openUkePermitDialog }), [stack.openUkePermitDialog]);

  return (
    <UkePermitDialogStackContext.Provider value={contextValue}>
      {children}
      {stack.dialogs.length > 0 ? (
        <Suspense fallback={null}>
          <UkePermitDialogStack
            dialogs={stack.dialogs}
            onClose={stack.closeUkePermitDialog}
            onFocus={stack.focusUkePermitDialog}
            onRectChange={stack.updateUkePermitDialogRect}
          />
        </Suspense>
      ) : null}
    </UkePermitDialogStackContext.Provider>
  );
}

export function useUkePermitDialogStack() {
  const context = useContext(UkePermitDialogStackContext);
  if (context === null) throw new Error("useUkePermitDialogStack must be used within UkePermitDialogStackProvider");
  return context;
}
