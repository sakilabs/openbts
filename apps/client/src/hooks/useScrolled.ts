import { useState, useEffect, useRef } from "react";

export function useScrolled() {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let scrollEl: HTMLElement | null = el.parentElement;
    while (scrollEl && scrollEl !== document.documentElement) {
      const { overflowY } = getComputedStyle(scrollEl);
      if (overflowY === "auto" || overflowY === "scroll") break;
      scrollEl = scrollEl.parentElement;
    }
    if (!scrollEl) return;
    const captured = scrollEl;
    const onScroll = () => setScrolled(captured.scrollTop > 0);
    captured.addEventListener("scroll", onScroll, { passive: true });
    return () => captured.removeEventListener("scroll", onScroll);
  }, []);

  return { ref, scrolled };
}
