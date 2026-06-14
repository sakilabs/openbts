export function hasReliableHoverPointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && navigator.maxTouchPoints === 0;
}
