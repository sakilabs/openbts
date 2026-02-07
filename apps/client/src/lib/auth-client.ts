import { createAuthClient } from "better-auth/react";
import { adminClient, apiKeyClient, multiSessionClient, usernameClient } from "better-auth/client/plugins";

import { API_BASE } from "@/lib/api";

export const authClient = createAuthClient({
	baseURL: API_BASE.replace(/\/api\/v1$/, ""),
	basePath: "/api/v1/auth",
	plugins: [adminClient(), apiKeyClient(), multiSessionClient(), usernameClient()],
});
