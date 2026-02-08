import { useSearchParams, Navigate } from "react-router";
import { SubmissionForm } from "@/features/submissions/components/submission-form";
import { RequireAuth } from "@/components/auth/require-auth";
import { useSettings } from "@/hooks/use-settings";
import type { RouteHandle } from "./_layout";

export const handle: RouteHandle = {
	titleKey: "items.submitStation",
	i18nNamespace: "nav",
	breadcrumbs: [{ titleKey: "sections.contribute", i18nNamespace: "nav" }],
};

export default function SubmissionsPage() {
	const [searchParams] = useSearchParams();
	const stationId = searchParams.get("station");
	const { data: settings, isLoading } = useSettings();

	if (!isLoading && !settings?.submissionsEnabled) return <Navigate to="/" replace />;

	return (
		<RequireAuth>
			<main className="flex-1 overflow-y-auto p-4">
				<SubmissionForm preloadStationId={stationId ? Number.parseInt(stationId, 10) : undefined} />
			</main>
		</RequireAuth>
	);
}
