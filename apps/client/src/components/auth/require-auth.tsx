import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";
import { AuthDialog } from "@/components/auth/auth-dialog";

interface RequireAuthProps {
	children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) return null;
	if (!session?.user) return <AuthDialog open forced onOpenChange={() => {}} />;

	return <>{children}</>;
}
