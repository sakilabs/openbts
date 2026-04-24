import {
  ChangeEmailCard,
  DeleteAccountCard,
  PasskeysCard,
  ProvidersCard,
  SessionsCard,
  TwoFactorCard,
  UpdateNameCard,
  UpdateUsernameCard,
} from "@daveyplate/better-auth-ui";
import { Alert01Icon, Alert02Icon, CheckmarkCircle02Icon, ComputerIcon, Key01Icon, SecurityLockIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiKeysCard } from "@/components/account/apikeysCard";
import { AvatarCard } from "@/components/account/avatarCard";
import { PasswordCard } from "@/components/account/passwordCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { API_BASE, fetchJson } from "@/lib/api";
import { authClient } from "@/lib/authClient";

function SectionHeader({ icon, title, description }: { icon: typeof UserIcon; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div aria-hidden="true" className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
        <HugeiconsIcon icon={icon} className="size-4.5" />
      </div>
      <div className="min-w-0 border-l-2 border-primary/50 pl-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function PasswordSection({ userId }: { userId: string }) {
  const { t } = useTranslation("settings");
  const qc = useQueryClient();

  const { data: passwordStatus } = useQuery({
    queryKey: ["account", "password", userId],
    queryFn: () => fetchJson<{ data: { hasPassword: boolean } }>(`${API_BASE}/account/password`).then((r) => r.data),
  });

  const { data: passkeys, isError: passkeysError } = useQuery({
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
    onError: (err: Error) => toast.error(err.message || t("security.passwordless.removeError")),
  });

  const hasPassword = passwordStatus?.hasPassword ?? null;
  const hasPasskey = (passkeys?.length ?? 0) > 0;

  const passwordlessHint = passkeysError
    ? t("security.passwordless.passkeyLoadError")
    : !hasPasskey
      ? t("security.passwordless.requiresPasskey")
      : t("security.passwordless.description");

  return (
    <>
      {hasPassword !== null ? <PasswordCard userId={userId} hasPassword={hasPassword} /> : null}

      {hasPassword ? (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none">{t("security.passwordless.title")}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{passwordlessHint}</p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              disabled={passkeysError || !hasPasskey || removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
              className="shrink-0"
            >
              {removeMutation.isPending ? <Spinner /> : null}
              {t(removeMutation.isPending ? "security.passwordless.removing" : "security.passwordless.remove")}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EmailVerificationCard({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  const { t } = useTranslation("settings");

  const resendMutation = useMutation({
    mutationFn: () => authClient.sendVerificationEmail({ email, callbackURL: "/account/settings" }),
    onSuccess: () => toast.success(t("account.emailVerification.resendSuccess")),
    onError: (err: Error) => toast.error(err.message ?? t("account.emailVerification.resendError")),
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <HugeiconsIcon
            aria-hidden="true"
            icon={emailVerified ? CheckmarkCircle02Icon : Alert01Icon}
            className={emailVerified ? "size-4 text-green-500 shrink-0" : "size-4 text-amber-500 shrink-0"}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">
              {emailVerified ? t("account.emailVerification.verified") : t("account.emailVerification.unverified")}
            </p>
            {!emailVerified && <p className="text-xs text-muted-foreground mt-1.5">{t("account.emailVerification.unverifiedDescription")}</p>}
          </div>
        </div>
        {!emailVerified && (
          <Button size="sm" variant="outline" disabled={resendMutation.isPending} onClick={() => resendMutation.mutate()}>
            {resendMutation.isPending ? <Spinner /> : null}
            {t(resendMutation.isPending ? "account.emailVerification.resending" : "account.emailVerification.resend")}
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-18 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function AccountSettingsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-8">
        <div className="border-b pb-6 space-y-1">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionSkeleton rows={5} />
          <SectionSkeleton rows={3} />
        </div>
        <SectionSkeleton rows={1} />
        <SectionSkeleton rows={1} />
        <SectionSkeleton rows={1} />
      </div>
    </div>
  );
}

function AccountSettingsPage() {
  const { t } = useTranslation("settings");
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <AccountSettingsSkeleton />;
  if (!session?.user) {
    return <Navigate to="/preferences" replace />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-8">
        <div className="border-b pb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("page.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("page.description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <SectionHeader icon={UserIcon} title={t("account.title")} description={t("account.description")} />
            <div className="space-y-3">
              <AvatarCard />
              <UpdateNameCard />
              <ChangeEmailCard />
              <EmailVerificationCard email={session.user.email} emailVerified={session.user.emailVerified} />
              <UpdateUsernameCard />
              <ProvidersCard />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader icon={SecurityLockIcon} title={t("security.title")} description={t("security.description")} />
            <div className="space-y-3">
              <PasswordSection userId={session.user.id} />
              <TwoFactorCard />
              <PasskeysCard />
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <SectionHeader icon={ComputerIcon} title={t("sessions.title")} description={t("sessions.description")} />
          <SessionsCard />
        </section>

        <section className="space-y-4">
          <SectionHeader icon={Key01Icon} title={t("apiKeys.title")} description={t("apiKeys.description")} />
          <ApiKeysCard userId={session.user.id} />
        </section>

        <section className="space-y-4 border-t border-destructive/20 pt-8 pb-6">
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
