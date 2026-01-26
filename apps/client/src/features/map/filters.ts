import { FILTER_KEYWORDS, FILTER_REGEX } from "./constants";
import type { ParsedFilter } from "./types";

const VALID_FILTER_KEYS = new Set(
	FILTER_KEYWORDS.map((f) => f.key.replace(":", ""))
);

export function parseFilters(query: string): {
	filters: ParsedFilter[];
	remainingText: string;
} {
	const filters: ParsedFilter[] = [];
	let remainingText = query;

	const matches = Array.from(query.matchAll(FILTER_REGEX));

	for (const match of matches) {
		const key = match[1]?.toLowerCase();
		if (!key || !VALID_FILTER_KEYS.has(key)) continue;

		// Capture groups: [1]=key, [2]=single quote, [3]=double quote, [4]=unquoted value
		const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();

		if (!value) continue;

		filters.push({
			key,
			value,
			raw: match[0],
		});

		// Remove from remaining text
		remainingText = remainingText.replace(match[0], "").trim();
	}

	return { filters, remainingText };
}
