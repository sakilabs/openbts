import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { TwoFactorRequiredError } from "@/lib/api";

export function useTwoFactorRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.action.type === "error" &&
        event.action.error instanceof TwoFactorRequiredError &&
        !location.pathname.startsWith("/account/two-factor")
      )
        void navigate({ to: "/account/two-factor", replace: true });
    });

    return unsubscribe;
  }, [navigate, location.pathname, queryClient]);
}
