export class PermissionManager {
	private matchPermission(required: string, granted: string): boolean {
		if (granted === "*") return true;

		const requiredParts = required.split(":").reverse();
		const grantedParts = granted.split(":").reverse();

		if (grantedParts.length > requiredParts.length) return false;

		for (let i = 0; i < grantedParts.length; i++) {
			if (grantedParts[i] === "*") return true;
			if (grantedParts[i] !== requiredParts[i]) return false;
		}

		return grantedParts.length === requiredParts.length;
	}

	getMissingPermissions(required: string[], scope: string): string[] {
		if (!required || required.length === 0) return [];
		if (!scope) return [...required];

		const granted = scope.split(" ").filter(Boolean);
		return required.filter((reqPerm) => !granted.some((grantedPerm) => this.matchPermission(reqPerm, grantedPerm)));
	}

	hasPermission(required: string[], scope: string): boolean {
		return this.getMissingPermissions(required, scope).length === 0;
	}
}

export const PermissionManagerInstance = new PermissionManager();
