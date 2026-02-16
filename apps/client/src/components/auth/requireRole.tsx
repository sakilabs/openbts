import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { authClient } from "@/lib/authClient";
import { RequireAuth } from "./requireAuth";

interface RequireRoleProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function RequireRole({ children, allowedRoles = ["admin"], redirectTo = "/" }: RequireRoleProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!session?.user) {
    return <RequireAuth>{children}</RequireAuth>;
  }

  const userRole = session.user.role || "user";

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
