import { useBlocker } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function useBeforeUnloadGuard(isDirty: boolean) {
  const { t } = useTranslation("submissions");

  useBlocker({
    shouldBlockFn: () => !window.confirm(t("unsavedChangesConfirm")),
    enableBeforeUnload: isDirty,
    disabled: !isDirty,
  });
}
