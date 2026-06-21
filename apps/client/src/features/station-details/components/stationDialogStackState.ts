import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { StationSource } from "@/types/station";

import { type StationDialogRect, areStationDialogRectsEqual, createInitialStationDialogRect } from "./stationDialogGeometry";

export type { StationDialogRect } from "./stationDialogGeometry";

export type StationDialogItem = {
  key: string;
  id: number;
  source: StationSource;
  rect: StationDialogRect;
  zIndex: number;
};

const MAX_STATION_DIALOGS = 2;

function getDialogKey(id: number, source: StationSource) {
  return `${source}:${id}`;
}

export function useStationDialogStackState() {
  const { t } = useTranslation("common");
  const [dialogs, setDialogs] = useState<StationDialogItem[]>([]);
  const dialogsRef = useRef<StationDialogItem[]>([]);
  const nextZIndexRef = useRef(1);

  const setDialogsSynced = useCallback((updater: (current: StationDialogItem[]) => StationDialogItem[]) => {
    const current = dialogsRef.current;
    const next = updater(current);
    if (next === current) return;
    dialogsRef.current = next;
    setDialogs(next);
  }, []);

  const focusStationDialog = useCallback(
    (key: string) => {
      setDialogsSynced((current) => {
        const dialog = current.find((item) => item.key === key);
        if (dialog === undefined) return current;

        const topZIndex = current.reduce((max, item) => Math.max(max, item.zIndex), 0);
        if (dialog.zIndex === topZIndex) return current;

        nextZIndexRef.current += 1;
        const zIndex = nextZIndexRef.current;
        return current.map((item) => (item.key === key ? { ...item, zIndex } : item));
      });
    },
    [setDialogsSynced],
  );

  const openStationDialog = useCallback(
    (id: number, source: StationSource) => {
      const key = getDialogKey(id, source);
      const current = dialogsRef.current;
      if (current.some((dialog) => dialog.key === key)) {
        focusStationDialog(key);
        return true;
      }

      if (current.length >= MAX_STATION_DIALOGS) {
        toast.info(t("toast.closeStationDialogFirst"));
        return false;
      }

      nextZIndexRef.current += 1;
      const dialog: StationDialogItem = {
        key,
        id,
        source,
        rect: createInitialStationDialogRect(current.length),
        zIndex: nextZIndexRef.current,
      };
      setDialogsSynced((previous) => [...previous, dialog]);
      return true;
    },
    [focusStationDialog, setDialogsSynced, t],
  );

  const closeStationDialog = useCallback(
    (key: string) => {
      setDialogsSynced((current) => current.filter((dialog) => dialog.key !== key));
    },
    [setDialogsSynced],
  );

  const closeTopStationDialog = useCallback(() => {
    const topDialog = dialogsRef.current.reduce<StationDialogItem | undefined>(
      (top, dialog) => (top === undefined || dialog.zIndex > top.zIndex ? dialog : top),
      undefined,
    );
    if (topDialog !== undefined) closeStationDialog(topDialog.key);
  }, [closeStationDialog]);

  const updateStationDialogRect = useCallback(
    (key: string, rect: StationDialogRect) => {
      setDialogsSynced((current) => {
        const dialog = current.find((item) => item.key === key);
        if (dialog === undefined) return current;
        if (areStationDialogRectsEqual(dialog.rect, rect)) return current;
        return current.map((item) => (item.key === key ? { ...item, rect } : item));
      });
    },
    [setDialogsSynced],
  );

  return {
    dialogs,
    openStationDialog,
    closeStationDialog,
    closeTopStationDialog,
    focusStationDialog,
    updateStationDialogRect,
  };
}
