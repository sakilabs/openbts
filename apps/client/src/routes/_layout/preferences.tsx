import { Navigate, createFileRoute } from "@tanstack/react-router";

function PreferencesRedirect() {
  return <Navigate to="/settings" search={{ tab: "preferences" }} replace />;
}

export const Route = createFileRoute("/_layout/preferences")({
  component: PreferencesRedirect,
});
