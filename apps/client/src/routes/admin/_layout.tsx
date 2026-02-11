import { Outlet, useMatches } from "react-router";
import { RequireRole } from "@/components/auth/requireRole";
import type { RouteHandle } from "@/routes/_layout";

const DEFAULT_ADMIN_ROLES = ["admin"];

export default function AdminLayout() {
	const matches = useMatches();
	const currentRoute = [...matches].reverse().find((m) => (m.handle as RouteHandle)?.allowedRoles);
	const allowedRoles = (currentRoute?.handle as RouteHandle)?.allowedRoles ?? DEFAULT_ADMIN_ROLES;

	return (
		<RequireRole allowedRoles={allowedRoles}>
			<Outlet />
		</RequireRole>
	);
}
