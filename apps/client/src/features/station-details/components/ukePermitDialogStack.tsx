import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "@/hooks/useMobile";

import { getFloatingDialogEntryKey, useFloatingDialogCoordinator } from "./floatingDialogCoordinator";
import { FloatingStationDialogFrame } from "./floatingStationDialogFrame";
import type { StationDialogRect } from "./stationDialogGeometry";
import { UkePermitDetailsDialogPanel } from "./ukePermitDetailsDialog";
import type { UkePermitDialogItem } from "./ukePermitDialogStackState";

const UKE_PERMIT_DIALOG_OWNER = "uke-permit";

type UkePermitDialogStackProps = {
  dialogs: UkePermitDialogItem[];
  onClose: (key: string) => void;
  onFocus: (key: string) => void;
  onRectChange: (key: string, rect: StationDialogRect) => void;
};

export function UkePermitDialogStack({ dialogs, onClose, onFocus, onRectChange }: UkePermitDialogStackProps) {
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
  const { syncStackEntries, topDialogKey } = useFloatingDialogCoordinator();
  const orderedDialogs = dialogs.slice().sort((a, b) => a.zIndex - b.zIndex);

  useLayoutEffect(() => {
    syncStackEntries(
      UKE_PERMIT_DIALOG_OWNER,
      dialogs.map((dialog) => ({
        key: dialog.key,
        zIndex: dialog.zIndex,
        onClose: () => onClose(dialog.key),
      })),
    );
  }, [dialogs, onClose, syncStackEntries]);

  useLayoutEffect(() => () => syncStackEntries(UKE_PERMIT_DIALOG_OWNER, []), [syncStackEntries]);

  if (dialogs.length === 0) return null;

  if (isMobile) {
    const topDialog = orderedDialogs[orderedDialogs.length - 1];
    if (topDialog === undefined) return null;
    if (topDialogKey !== getFloatingDialogEntryKey(UKE_PERMIT_DIALOG_OWNER, topDialog.key)) return null;

    return createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm cursor-default"
          onClick={() => onClose(topDialog.key)}
          aria-label={t("actions.close")}
        />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto pointer-events-none">
          <UkePermitDetailsDialogPanel
            station={topDialog.station}
            onClose={() => onClose(topDialog.key)}
            className="pointer-events-auto animate-in fade-in zoom-in-95 duration-200 w-full max-w-3xl"
            contentClassName="border border-border/70"
          />
        </div>
      </>,
      document.body,
    );
  }

  return createPortal(
    <>
      {orderedDialogs.map((dialog) => (
        <FloatingStationDialogFrame
          key={dialog.key}
          rect={dialog.rect}
          zIndex={dialog.zIndex}
          onFocus={() => onFocus(dialog.key)}
          onRectChange={(rect) => onRectChange(dialog.key, rect)}
        >
          {({ contentRef, bodyRef, bodyContentRef, headerDragProps }) => (
            <UkePermitDetailsDialogPanel
              station={dialog.station}
              onClose={() => onClose(dialog.key)}
              contentRef={contentRef}
              bodyRef={bodyRef}
              bodyContentRef={bodyContentRef}
              className="h-full"
              contentClassName="h-full max-h-none border border-border/70"
              headerDragProps={headerDragProps}
            />
          )}
        </FloatingStationDialogFrame>
      ))}
    </>,
    document.body,
  );
}
