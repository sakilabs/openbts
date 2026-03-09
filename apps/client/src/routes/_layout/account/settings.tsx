import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, SecurityLockIcon, ComputerIcon, Alert02Icon, Key01Icon } from "@hugeicons/core-free-icons";
import {
  AccountSettingsCards,
  ChangePasswordCard,
  DeleteAccountCard,
  PasskeysCard,
  ProvidersCard,
  SessionsCard,
  TwoFactorCard,
} from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/authClient";
import { fetchJson, API_BASE } from "@/lib/api";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ApiKeysCard } from "@/components/account/api-keys-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function SectionHeader({ icon, title, description }: { icon: typeof UserIcon; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
        <HugeiconsIcon icon={icon} className="size-4.5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function PasswordlessToggle({ userId }: { userId: string }) {
  const { t } = useTranslation("settings");
  const qc = useQueryClient();

  const { data: passwordStatus } = useQuery({
    queryKey: ["account", "password", userId],
    queryFn: () => fetchJson<{ data: { hasPassword: boolean } }>(`${API_BASE}/account/password`).then((r) => r.data),
  });

  const { data: passkeys } = useQuery({
    queryKey: ["passkeys", userId],
    queryFn: () => authClient.passkey.listUserPasskeys(),
    select: (r) => r.data ?? [],
  });

  const removeMutation = useMutation({
    mutationFn: () => fetchJson<void>(`${API_BASE}/account/password`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("security.passwordless.success"));
      void qc.invalidateQueries({ queryKey: ["account", "password", userId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const hasPassword = passwordStatus?.hasPassword;
  const hasPasskey = (passkeys?.length ?? 0) > 0;

  if (!hasPassword) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">{t("security.passwordless.title")}</p>
        <p className="text-xs text-muted-foreground mt-1.5">{t("security.passwordless.noPassword")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none">{t("security.passwordless.title")}</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {!hasPasskey ? t("security.passwordless.requiresPasskey") : t("security.passwordless.description")}
          </p>
        </div>
        <Button size="sm" variant="destructive" disabled={!hasPasskey || removeMutation.isPending} onClick={() => removeMutation.mutate()}>
          {removeMutation.isPending ? (
            <>
              <Spinner />
              {t("security.passwordless.removing")}
            </>
          ) : (
            t("security.passwordless.remove")
          )}
        </Button>
      </div>
    </div>
  );
}

function AccountSettingsPage() {
  const { t } = useTranslation("settings");
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session?.user) {
    return <Navigate to="/preferences" replace />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{t("page.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("page.description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-0">
            <SectionHeader icon={UserIcon} title={t("account.title")} description={t("account.description")} />
            <AccountSettingsCards className="gap-3" />
          </section>

          <section className="space-y-0">
            <SectionHeader icon={SecurityLockIcon} title={t("security.title")} description={t("security.description")} />
            <div className="space-y-3">
              <ChangePasswordCard />
              <TwoFactorCard />
              <PasskeysCard />
              <ProvidersCard />
              <PasswordlessToggle userId={session.user.id} />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-0">
            <SectionHeader icon={ComputerIcon} title={t("sessions.title")} description={t("sessions.description")} />
            <SessionsCard />
          </section>

          <section className="space-y-0">
            <SectionHeader icon={Key01Icon} title={t("apiKeys.title")} description={t("apiKeys.description")} />
            <ApiKeysCard userId={session.user.id} />
          </section>
        </div>

        <section className="space-y-0 pb-6">
          <SectionHeader icon={Alert02Icon} title={t("dangerZone.title")} description={t("dangerZone.description")} />
          <DeleteAccountCard />
        </section>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/account/settings")({
  component: AccountSettingsPage,
  staticData: {
    titleKey: "page.shortTitle",
    i18nNamespace: "settings",
    breadcrumbs: [{ titleKey: "account.title", i18nNamespace: "settings" }],
  },
});
