import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
	...defaultStatements,
	cells: ["read", "create", "update", "delete"],
	stations: ["read", "create", "update", "delete"],
	operators: ["read", "create", "update", "delete"],
	locations: ["read", "create", "update", "delete"],
	bands: ["read", "create", "update", "delete"],
	submissions: ["read", "create", "update", "delete"],
} as const;

export const accessControl = createAccessControl(statement);

export const userRole = accessControl.newRole({
	stations: ["read"],
	cells: ["read"],
	operators: ["read"],
	locations: ["read"],
	bands: ["read"],
});

export const modRole = accessControl.newRole({
	// tbh idk what to put for mod
});

export const adminRole = accessControl.newRole({
	...adminAc.statements,
	cells: ["read", "create", "update", "delete"],
	stations: ["read", "create", "update", "delete"],
	operators: ["read", "create", "update", "delete"],
	locations: ["read", "create", "update", "delete"],
	bands: ["read", "create", "update", "delete"],
	submissions: ["read", "create", "update", "delete"],
});
