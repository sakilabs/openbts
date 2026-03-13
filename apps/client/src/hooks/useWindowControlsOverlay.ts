import { useState, useEffect } from "react";

interface WindowControlsOverlay extends EventTarget {
  readonly visible: boolean;
  addEventListener(type: "geometrychange", listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: "geometrychange", listener: EventListenerOrEventListenerObject): void;
}

declare global {
  interface Navigator {
    readonly windowControlsOverlay?: WindowControlsOverlay;
    readonly userAgentData?: { readonly platform: string };
  }
}

function detectMacOS(): boolean {
  if (navigator.userAgentData) return navigator.userAgentData.platform === "macOS";
  return /Mac OS X/.test(navigator.userAgent);
}

export function useWindowControlsOverlay(): { visible: boolean; isMacOS: boolean } {
  const [visible, setVisible] = useState(() => navigator.windowControlsOverlay?.visible ?? false);
  const isMacOS = detectMacOS();

  useEffect(() => {
    const overlay = navigator.windowControlsOverlay;
    if (!overlay) return;
    const handler = () => setVisible(overlay.visible);
    overlay.addEventListener("geometrychange", handler);
    return () => overlay.removeEventListener("geometrychange", handler);
  }, []);

  return { visible, isMacOS };
}
