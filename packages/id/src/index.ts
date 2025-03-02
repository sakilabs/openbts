import { customAlphabet } from "nanoid";
export const nanoid = customAlphabet("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

const prefixes = {
	user: "user",
	refresh: "rfsh",
	attachment: "att",
	list: "list",
	api: "bts",
} as const;

export const newId = (prefix: keyof typeof prefixes): string => {
	return [prefixes[prefix], nanoid(16)].join("_");
};
