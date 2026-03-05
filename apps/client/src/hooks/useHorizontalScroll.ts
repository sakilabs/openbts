import { useEffect, useRef } from "react";

export function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      if (!el) return;
      const canScrollX = el.scrollWidth > el.clientWidth;
      if (!canScrollX) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return ref;
}
