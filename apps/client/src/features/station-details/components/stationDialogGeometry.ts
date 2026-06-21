export type StationDialogRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StationDialogInteractionMode = "drag" | "resize-corner" | "resize-horizontal";

export const STATION_DIALOG_DESKTOP_MIN_WIDTH = 610;
export const STATION_DIALOG_DESKTOP_MIN_HEIGHT = 650;

const DEFAULT_DIALOG_WIDTH = 920;
const DEFAULT_DIALOG_HEIGHT = STATION_DIALOG_DESKTOP_MIN_HEIGHT;
const DIALOG_OFFSET = 32;
const DIALOG_MARGIN = 16;
const RECT_SYNC_THRESHOLD = 1;

function getViewportBounds() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function clampStationDialogRect(rect: StationDialogRect): StationDialogRect {
  const bounds = getViewportBounds();
  const maxAvailableWidth = Math.max(0, bounds.width - DIALOG_MARGIN * 2);
  const maxAvailableHeight = Math.max(0, bounds.height - DIALOG_MARGIN * 2);
  const minWidth = Math.min(STATION_DIALOG_DESKTOP_MIN_WIDTH, maxAvailableWidth);
  const minHeight = Math.min(STATION_DIALOG_DESKTOP_MIN_HEIGHT, maxAvailableHeight);
  const width = Math.min(Math.max(rect.width, minWidth), maxAvailableWidth);
  const height = Math.min(Math.max(rect.height, minHeight), maxAvailableHeight);
  const x = Math.min(Math.max(rect.x, DIALOG_MARGIN), Math.max(DIALOG_MARGIN, bounds.width - width - DIALOG_MARGIN));
  const y = Math.min(Math.max(rect.y, DIALOG_MARGIN), Math.max(DIALOG_MARGIN, bounds.height - height - DIALOG_MARGIN));

  return { x, y, width, height };
}

export function createInitialStationDialogRect(index: number): StationDialogRect {
  const bounds = getViewportBounds();
  const width = Math.min(DEFAULT_DIALOG_WIDTH, bounds.width - DIALOG_MARGIN * 2);
  const height = Math.min(DEFAULT_DIALOG_HEIGHT, bounds.height - DIALOG_MARGIN * 2);

  return clampStationDialogRect({
    x: (bounds.width - width) / 2 + index * DIALOG_OFFSET,
    y: (bounds.height - height) / 2 + index * DIALOG_OFFSET,
    width,
    height,
  });
}

export function applyStationDialogRect(node: HTMLDivElement | null, rect: StationDialogRect) {
  if (node === null) return;
  node.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
}

export function getNaturalStationDialogHeight(content: HTMLDivElement, body: HTMLDivElement, bodyContent: HTMLDivElement) {
  const heightOutsideScrollableBody = content.scrollHeight - body.clientHeight;
  return Math.ceil(heightOutsideScrollableBody + bodyContent.scrollHeight);
}

export function getStationDialogCursor(mode: StationDialogInteractionMode) {
  if (mode === "drag") return "grabbing";
  if (mode === "resize-horizontal") return "ew-resize";
  return "nwse-resize";
}

export function getStationDialogInteractionRect(mode: StationDialogInteractionMode, startRect: StationDialogRect, deltaX: number, deltaY: number) {
  if (mode === "drag") return clampStationDialogRect({ ...startRect, x: startRect.x + deltaX, y: startRect.y + deltaY });
  if (mode === "resize-horizontal") return clampStationDialogRect({ ...startRect, width: startRect.width + deltaX });
  return clampStationDialogRect({ ...startRect, width: startRect.width + deltaX, height: startRect.height + deltaY });
}

export function shouldSyncStationDialogRect(current: StationDialogRect, next: StationDialogRect) {
  return (
    Math.abs(current.x - next.x) >= RECT_SYNC_THRESHOLD ||
    Math.abs(current.y - next.y) >= RECT_SYNC_THRESHOLD ||
    Math.abs(current.width - next.width) >= RECT_SYNC_THRESHOLD ||
    Math.abs(current.height - next.height) >= RECT_SYNC_THRESHOLD
  );
}

export function areStationDialogRectsEqual(current: StationDialogRect, next: StationDialogRect) {
  return current.x === next.x && current.y === next.y && current.width === next.width && current.height === next.height;
}
