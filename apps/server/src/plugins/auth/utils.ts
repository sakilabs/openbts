import { auth } from "../betterauth.plugin.js";

export async function verifyPermissions(userId: string, permissions: Record<string, string[]>) {
	const hasPerm = await auth.api.userHasPermission({
		body: {
			userId: userId,
			permissions,
		},
	});

	return hasPerm.success || false;
}
