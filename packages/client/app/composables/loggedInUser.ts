export const loggedInUser = () => {
	return useState<{ user_id: number; display_name: string; username: string; verified: boolean } | null>("loggedInUser");
};
