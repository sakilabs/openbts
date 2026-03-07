import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ListMapView } from "@/features/lists/components/listMapView";
import { useSettings } from "@/hooks/useSettings";

function SharedListPage() {
  const { uuid } = Route.useParams();
  const { data: settings, isLoading } = useSettings();

  if (!isLoading && !settings?.enableUserLists) return <Navigate to="/" replace />;

  return (
    <div className="flex-1">
      <ListMapView uuid={uuid} />
    </div>
  );
}

export const Route = createFileRoute("/_layout/lists/$uuid")({
  component: SharedListPage,
  staticData: {
    titleKey: "items.sharedList",
    i18nNamespace: "nav",
    breadcrumbs: [{ titleKey: "sections.lists", i18nNamespace: "nav" }],
  },
});
