import type { KeyboardEvent } from "react";

export function navigateRowHorizontal<T extends HTMLElement>(e: KeyboardEvent<T>): void {
  if (!e.ctrlKey || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
  const tr = e.currentTarget.closest("tr");
  if (!tr) return;
  const focusable = Array.from(tr.querySelectorAll<HTMLElement>("[data-nav-cell]:not([disabled])"));
  const idx = focusable.indexOf(e.currentTarget);
  if (idx === -1) return;
  e.preventDefault();
  if (e.key === "ArrowRight") focusable[idx + 1]?.focus({ focusVisible: true });
  else focusable[idx - 1]?.focus({ focusVisible: true });
}
