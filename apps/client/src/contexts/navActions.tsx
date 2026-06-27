import { type ReactNode, createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

type NavActionsContextValue = {
  targetId: string;
};

const DEFAULT_TARGET_ID = "header-actions";
const NavActionsContext = createContext<NavActionsContextValue>({ targetId: DEFAULT_TARGET_ID });

type Listener = () => void;
const listeners = new Set<Listener>();
let sharedObserver: MutationObserver | null = null;

function ensureObserver() {
  if (typeof window === "undefined" || typeof document === "undefined" || sharedObserver) return;
  sharedObserver = new window.MutationObserver(() => {
    for (const listener of listeners) listener();
  });
  sharedObserver.observe(document.body, { childList: true, subtree: true });
}

function subscribeToTarget(callback: Listener) {
  if (typeof window === "undefined") return () => {};

  listeners.add(callback);
  ensureObserver();
  const frame = window.requestAnimationFrame(callback);

  return () => {
    window.cancelAnimationFrame(frame);
    listeners.delete(callback);
    if (listeners.size === 0 && sharedObserver) {
      sharedObserver.disconnect();
      sharedObserver = null;
    }
  };
}

export function NavActionsProvider({ children, targetId }: { children: ReactNode; targetId?: string }) {
  const value = useMemo(() => ({ targetId: targetId ?? DEFAULT_TARGET_ID }), [targetId]);
  return <NavActionsContext.Provider value={value}>{children}</NavActionsContext.Provider>;
}

export function useNavActionTarget() {
  const { targetId } = useContext(NavActionsContext);
  const getSnapshot = useCallback(() => {
    if (typeof document === "undefined") return null;
    return document.getElementById(targetId);
  }, [targetId]);

  return useSyncExternalStore(subscribeToTarget, getSnapshot, () => null);
}
