import { useState, useEffect } from "react";

interface WindowControlsOverlay extends EventTarget {
  readonly visible: boolean;
  addEventListener(type: "geometrychange", listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: "geometrychange", listener: EventListenerOrEventListenerObject): void;
}

declare global {
  interface Navigator {
    readonly windowControlsOverlay?: WindowControlsOverlay;
  }
}

export function useWindowControlsOverlay(): boolean {
  const [visible, setVisible] = useState(() => navigator.windowControlsOverlay?.visible ?? false);

  useEffect(() => {
    const overlay = navigator.windowControlsOverlay;
    if (!overlay) return;
    const handler = () => setVisible(overlay.visible);
    overlay.addEventListener("geometrychange", handler);
    return () => overlay.removeEventListener("geometrychange", handler);
  }, []);

  return visible;
}
