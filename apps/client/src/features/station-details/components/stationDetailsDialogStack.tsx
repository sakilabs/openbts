import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "@/hooks/useMobile";

import {
  STATION_DIALOG_DESKTOP_MIN_WIDTH,
  type StationDialogInteractionMode,
  applyStationDialogRect,
  clampStationDialogRect,
  getNaturalStationDialogHeight,
  getStationDialogCursor,
  getStationDialogInteractionRect,
  getStationDialogTransform,
  shouldSyncStationDialogRect,
} from "./stationDialogGeometry";
import type { StationDialogItem, StationDialogRect } from "./stationDialogStackState";
import { StationDetailsDialogPanel } from "./stationsDetailsDialog";

type StationDetailsDialogStackProps = {
  dialogs: StationDialogItem[];
  onClose: (key: string) => void;
  onCloseTop: () => void;
  onFocus: (key: string) => void;
  onRectChange: (key: string, rect: StationDialogRect) => void;
};

type FloatingFrameProps = {
  dialog: StationDialogItem;
  onClose: () => void;
  onFocus: () => void;
  onRectChange: (rect: StationDialogRect) => void;
};

type InteractionState = {
  pointerId: number;
  mode: StationDialogInteractionMode;
  startX: number;
  startY: number;
  startRect: StationDialogRect;
  nextRect: StationDialogRect;
  frameId: number | null;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return target.closest("button,a,input,textarea,select,[role='button']") !== null;
}

function FloatingStationDialogFrame({ dialog, onClose, onFocus, onRectChange }: FloatingFrameProps) {
  const { t } = useTranslation("common");
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodyContentRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const userResizedHeightRef = useRef(false);
  const dialogRectRef = useRef(dialog.rect);
  const onRectChangeRef = useRef(onRectChange);

  dialogRectRef.current = dialog.rect;
  onRectChangeRef.current = onRectChange;

  useLayoutEffect(() => {
    const nextRect = clampStationDialogRect(dialog.rect);
    applyStationDialogRect(panelRef.current, nextRect);
    if (shouldSyncStationDialogRect(dialog.rect, nextRect)) {
      dialogRectRef.current = nextRect;
      onRectChangeRef.current(nextRect);
    }
  }, [dialog.rect]);

  useEffect(
    () => () => {
      const interaction = interactionRef.current;
      if (interaction !== null && interaction.frameId !== null) cancelAnimationFrame(interaction.frameId);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    },
    [],
  );

  const fitDialogToContent = useCallback(() => {
    if (userResizedHeightRef.current || interactionRef.current !== null) return;

    const content = contentRef.current;
    const body = bodyRef.current;
    const bodyContent = bodyContentRef.current;
    if (content === null || body === null || bodyContent === null) return;

    const currentRect = dialogRectRef.current;
    const naturalHeight = getNaturalStationDialogHeight(content, body, bodyContent);
    const nextRect = clampStationDialogRect({
      ...currentRect,
      y: currentRect.y + (currentRect.height - naturalHeight) / 2,
      height: naturalHeight,
    });

    if (!shouldSyncStationDialogRect(currentRect, nextRect)) return;
    dialogRectRef.current = nextRect;
    applyStationDialogRect(panelRef.current, nextRect);
    onRectChangeRef.current(nextRect);
  }, []);

  useLayoutEffect(() => {
    const bodyContent = bodyContentRef.current;
    if (bodyContent === null) return;

    let frameId: number | null = null;
    const scheduleFit = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        frameId = null;
        fitDialogToContent();
      });
    };

    fitDialogToContent();

    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(bodyContent);

    return () => {
      resizeObserver.disconnect();
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [fitDialogToContent]);

  const beginInteraction = useCallback(
    (event: ReactPointerEvent<HTMLElement>, mode: StationDialogInteractionMode) => {
      if (mode === "drag" && isInteractiveTarget(event.target)) return;

      event.preventDefault();
      event.stopPropagation();
      onFocus();
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.userSelect = "none";
      document.body.style.cursor = getStationDialogCursor(mode);
      if (mode === "resize-corner") userResizedHeightRef.current = true;
      const startRect = clampStationDialogRect(dialogRectRef.current);
      interactionRef.current = {
        pointerId: event.pointerId,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        startRect,
        nextRect: startRect,
        frameId: null,
      };
    },
    [onFocus],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (interaction === null || interaction.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    const nextRect = getStationDialogInteractionRect(interaction.mode, interaction.startRect, deltaX, deltaY);

    interaction.nextRect = nextRect;
    if (interaction.frameId === null) {
      interaction.frameId = requestAnimationFrame(() => {
        interaction.frameId = null;
        applyStationDialogRect(panelRef.current, interaction.nextRect);
      });
    }
  }, []);

  const endInteraction = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (interaction === null || interaction.pointerId !== event.pointerId) return;

    const nextRect = interaction.nextRect;
    event.preventDefault();
    event.stopPropagation();
    if (interaction.frameId !== null) cancelAnimationFrame(interaction.frameId);
    interactionRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    dialogRectRef.current = nextRect;
    applyStationDialogRect(panelRef.current, nextRect);
    onRectChangeRef.current(nextRect);
  }, []);

  return (
    <div
      ref={panelRef}
      className="fixed pointer-events-auto animate-in fade-in duration-100 will-change-transform"
      style={{
        transform: getStationDialogTransform(dialog.rect),
        minWidth: STATION_DIALOG_DESKTOP_MIN_WIDTH,
        width: dialog.rect.width,
        height: dialog.rect.height,
        zIndex: dialog.zIndex,
      }}
      onPointerDown={onFocus}
    >
      <StationDetailsDialogPanel
        stationId={dialog.id}
        source={dialog.source}
        onClose={onClose}
        showPhotoPanel={false}
        contentRef={contentRef}
        bodyRef={bodyRef}
        bodyContentRef={bodyContentRef}
        onContentLayoutChange={fitDialogToContent}
        className="h-full"
        contentClassName="h-full max-h-none border border-border/70"
        headerDragProps={{
          className: "cursor-grab active:cursor-grabbing select-none touch-none",
          onPointerDown: (event) => beginInteraction(event, "drag"),
          onPointerMove: handlePointerMove,
          onPointerUp: endInteraction,
          onPointerCancel: endInteraction,
        }}
      />
      <button
        type="button"
        aria-label={t("actions.resizeHorizontally")}
        className="absolute -right-1 top-8 bottom-8 w-3 border-0 bg-transparent p-0 pointer-events-auto cursor-ew-resize touch-none opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100 after:absolute after:right-1 after:top-1/2 after:h-16 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-muted-foreground/40"
        onPointerDown={(event) => beginInteraction(event, "resize-horizontal")}
        onPointerMove={handlePointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      />
      <button
        type="button"
        aria-label={t("actions.resize")}
        className="absolute bottom-1 right-1 pointer-events-auto size-5 rounded-br-2xl cursor-nwse-resize touch-none opacity-60 hover:opacity-100 before:absolute before:right-1 before:bottom-1 before:h-2.5 before:w-2.5 before:border-r before:border-b before:border-muted-foreground"
        onPointerDown={(event) => beginInteraction(event, "resize-corner")}
        onPointerMove={handlePointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      />
    </div>
  );
}

export function StationDetailsDialogStack({ dialogs, onClose, onCloseTop, onFocus, onRectChange }: StationDetailsDialogStackProps) {
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
  const orderedDialogs = dialogs.slice().sort((a, b) => a.zIndex - b.zIndex);

  useEffect(() => {
    if (dialogs.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseTop();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogs.length, onCloseTop]);

  if (dialogs.length === 0) return null;

  if (isMobile) {
    const topDialog = orderedDialogs[orderedDialogs.length - 1];
    if (topDialog === undefined) return null;

    return createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm cursor-default"
          onClick={() => onClose(topDialog.key)}
          aria-label={t("actions.close")}
        />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto pointer-events-none">
          <StationDetailsDialogPanel
            stationId={topDialog.id}
            source={topDialog.source}
            onClose={() => onClose(topDialog.key)}
            showPhotoPanel={false}
            className="pointer-events-auto animate-in fade-in zoom-in-95 duration-200 w-full max-w-4xl"
            contentClassName="border border-border/70"
          />
        </div>
      </>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {orderedDialogs.map((dialog) => (
        <FloatingStationDialogFrame
          key={dialog.key}
          dialog={dialog}
          onClose={() => onClose(dialog.key)}
          onFocus={() => onFocus(dialog.key)}
          onRectChange={(rect) => onRectChange(dialog.key, rect)}
        />
      ))}
    </div>,
    document.body,
  );
}
