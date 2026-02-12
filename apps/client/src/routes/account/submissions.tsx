import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/requireAuth";
import { MySubmissions } from "@/features/account/components/mySubmissions";
import { useSettings } from "@/hooks/useSettings";

import type { RouteHandle } from "../_layout";

export const handle: RouteHandle = {
	titleKey: "userPage.title",
	i18nNamespace: "submissions",
	breadcrumbs: [{ titleKey: "account.title", i18nNamespace: "settings", path: "/account/settings" }],
};

export default function MySubmissionsPage() {
	const { t } = useTranslation("submissions");
	const { data: settings, isLoading } = useSettings();

	if (!isLoading && !settings?.submissionsEnabled) return <Navigate to="/" replace />;

	return (
		<RequireAuth>
			<div className="flex-1 overflow-y-auto">
				<div className="p-6 space-y-6">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<h1 className="text-xl font-bold tracking-tight">{t("userPage.title")}</h1>
							<p className="text-muted-foreground text-sm">{t("userPage.description")}</p>
						</div>
						<Button size="sm" render={<Link to="/submission" />}>
							<HugeiconsIcon icon={Add01Icon} className="size-4" />
							{t("submitNew")}
						</Button>
					</div>
					<MySubmissions />
				</div>
			</div>
		</RequireAuth>
	);
}
