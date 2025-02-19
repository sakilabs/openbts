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

	getMissingPermissions(required: string[], granted: string[]): string[] {
		if (!required || required.length === 0) return [];
		if (!granted || granted.length === 0) return [...required];

		return required.filter((reqPerm) => !granted.some((grantedPerm) => this.matchPermission(reqPerm, grantedPerm)));
	}

	hasPermission(required: string[], granted: string[]): boolean {
		return this.getMissingPermissions(required, granted).length === 0;
	}
}

export const PermissionManagerInstance = new PermissionManager();
