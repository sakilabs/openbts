import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RequireAuth } from "@/components/auth/requireAuth";
import { Button } from "@/components/ui/button";
import { MySubmissions } from "@/features/account/components/mySubmissions";
import { useSettings } from "@/hooks/useSettings";

function MySubmissionsPage() {
  const { t } = useTranslation("submissions");
  const { data: settings, isLoading } = useSettings();

  if (!isLoading && !settings?.submissionsEnabled) return <Navigate to="/" replace />;

  return (
    <RequireAuth>
      <main className="flex-1 flex flex-col min-h-0 p-6 gap-6">
        <div className="flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{t("userPage.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("userPage.description")}</p>
          </div>
          <Button size="sm" nativeButton={false} render={<Link to="/submission" />}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            {t("submitNew")}
          </Button>
        </div>
        <MySubmissions />
      </main>
    </RequireAuth>
  );
}

export const Route = createFileRoute("/_layout/account/submissions")({
  component: MySubmissionsPage,
  staticData: {
    titleKey: "userPage.title",
    i18nNamespace: "submissions",
    breadcrumbs: [{ titleKey: "account.title", i18nNamespace: "settings", path: "/account/settings" }],
  },
});
