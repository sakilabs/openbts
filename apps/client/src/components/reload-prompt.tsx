import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-border bg-popover p-4 shadow-lg animate-in slide-in-from-bottom-4 fade-in">
      <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-3 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{t("pwa.updateAvailable")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("pwa.updateDescription")}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          {t("actions.update")}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setNeedRefresh(false)} aria-label={t("actions.close")}>
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
