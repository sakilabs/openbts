export function hasReliableHoverPointer() {
  return window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;
}
