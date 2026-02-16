import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "@tanstack/react-query";
import { BackendUnavailableError } from "@/lib/api";

export function BackendStatusProvider({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error" && event.action.error instanceof BackendUnavailableError) setIsUnavailable(true);
    });
    return unsubscribe;
  }, [queryClient]);

  if (isUnavailable) return <BackendUnavailableScreen onRetry={() => window.location.reload()} />;

  return children;
}

function BackendUnavailableScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-foreground">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">{t("backendUnavailable.title")}</h1>
        <p className="text-muted-foreground">{t("backendUnavailable.description")}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("error.reload")}
        </button>
      </div>
    </div>
  );
}
