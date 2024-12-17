import type { userListRequest } from "@/interfaces/requests";

export const userLists = () => {
	return useState<userListRequest[]>("userLists", () => []);
};

export const currentUserList = () => {
	return useState<userListRequest | null>("currentUserList", () => null);
};
