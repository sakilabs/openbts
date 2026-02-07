import { useTranslation } from "react-i18next";
import { AccountSettingsCards, ApiKeysCard, ChangePasswordCard, SessionsCard } from "@daveyplate/better-auth-ui";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { Navigate } from "react-router";

import type { RouteHandle } from "../_layout";

export const handle: RouteHandle = {
	titleKey: "page.title",
	i18nNamespace: "settings",
};

export default function AccountSettingsPage() {
	const { t } = useTranslation("settings");
	const { data: session } = authClient.useSession();

	if (!session?.user) {
		return <Navigate to="/preferences" replace />;
	}

	return (
		<main className="flex-1 overflow-y-auto p-4">
			<div className="max-w-2xl space-y-8">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{t("page.title")}</h1>
					<p className="text-muted-foreground text-sm">{t("page.description")}</p>
				</div>

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">{t("account.title")}</h2>
					<AccountSettingsCards className="gap-4" />
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">{t("security.title")}</h2>
					<div className="space-y-4">
						<ChangePasswordCard />
						<SessionsCard />
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">API Keys</h2>
					<ApiKeysCard />
				</section>
			</div>
		</main>
	);
}
