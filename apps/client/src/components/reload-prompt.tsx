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
  } = useRegisterSW({
    onRegistered: (r) => r && setInterval(() => r.update(), 5 * 60 * 1000),
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-popover p-4 shadow-lg animate-in slide-in-from-bottom-4 fade-in">
      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" onClick={() => setNeedRefresh(false)} aria-label={t("actions.close")}>
        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
      </Button>
      <div className="flex items-center gap-3">
        <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-4 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{t("pwa.updateAvailable")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("pwa.updateDescription")}</p>
        </div>
      </div>
      <Button size="sm" className="mt-3 w-full" onClick={() => updateServiceWorker(true)}>
        {t("actions.update")}
      </Button>
    </div>
  );
}
