import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, SecurityLockIcon, Key01Icon, ComputerIcon, Alert02Icon } from "@hugeicons/core-free-icons";
import {
	AccountSettingsCards,
	ApiKeysCard,
	ChangePasswordCard,
	DeleteAccountCard,
	PasskeysCard,
	ProvidersCard,
	SessionsCard,
	TwoFactorCard,
} from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import { Navigate } from "react-router";

import type { RouteHandle } from "../_layout";

export const handle: RouteHandle = {
	titleKey: "page.shortTitle",
	i18nNamespace: "settings",
	breadcrumbs: [{ titleKey: "account.title", i18nNamespace: "settings" }],
};

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

export default function AccountSettingsPage() {
	const { t } = useTranslation("settings");
	const { data: session } = authClient.useSession();

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
							{/* <TwoFactorCard /> */}
							<PasskeysCard />
							<ProvidersCard />
						</div>
					</section>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<section className="space-y-0">
						<SectionHeader icon={Key01Icon} title={t("apiKeys.title")} description={t("apiKeys.description")} />
						<ApiKeysCard />
					</section>

					<section className="space-y-0">
						<SectionHeader icon={ComputerIcon} title={t("sessions.title")} description={t("sessions.description")} />
						<SessionsCard />
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
