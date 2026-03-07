import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ListsPageContent } from "@/features/lists/components/listsPage";
import { RequireAuth } from "@/components/auth/requireAuth";
import { useSettings } from "@/hooks/useSettings";

function ListsPage() {
  const { data: settings, isLoading } = useSettings();

  if (!isLoading && !settings?.enableUserLists) return <Navigate to="/" replace />;

  return (
    <RequireAuth>
      <main className="flex-1 flex flex-col min-h-0 p-4">
        <ListsPageContent />
      </main>
    </RequireAuth>
  );
}

export const Route = createFileRoute("/_layout/lists/")({
  component: ListsPage,
  staticData: {
    titleKey: "items.myLists",
    i18nNamespace: "nav",
  },
});
