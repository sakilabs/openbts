export interface AdminUser {
	id: string;
	name: string;
	email: string;
	role?: string;
	banned?: boolean;
	banReason?: string;
	banExpires?: string;
	createdAt: string;
	image?: string | null;
	username?: string;
}

export interface Session {
	id: string;
	token: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	ipAddress?: string;
	userAgent?: string;
}
