import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterKeyword, ParsedFilter } from "../types";

type OverlayType = "autocomplete" | "results" | null;

type UseSearchStateArgs = {
	filterKeywords: FilterKeyword[];
	parseFilters: (query: string) => {
		filters: ParsedFilter[];
		remainingText: string;
	};
};

function computeOverlay(input: string, hasMatches: boolean): OverlayType {
	if (input === "") return "autocomplete";
	if (hasMatches) return "autocomplete";
	if (input.trim() !== "") return "results";
	return null;
}

function getLastWord(input: string): string {
	const words = input.split(/\s/);
	return words[words.length - 1] || "";
}

function getAutocompleteMatches(input: string, keywords: FilterKeyword[]): FilterKeyword[] {
	if (input === "") return keywords;

	const lastWord = getLastWord(input);
	if (lastWord.length === 0 || lastWord.includes(":")) return [];

	return keywords.filter((kw) => kw.key.toLowerCase().startsWith(lastWord.toLowerCase()));
}

export function useSearchState({ filterKeywords, parseFilters }: UseSearchStateArgs) {
	const [inputValue, setInputValue] = useState("");
	const [parsedFilters, setParsedFilters] = useState<ParsedFilter[]>([]);
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const query = useMemo(() => [...parsedFilters.map((f) => f.raw), inputValue].filter(Boolean).join(" "), [parsedFilters, inputValue]);

	const searchMode = debouncedQuery.trim() === "" ? "bounds" : "search";

	const autocompleteOptions = useMemo(() => getAutocompleteMatches(inputValue, filterKeywords), [inputValue, filterKeywords]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query), 500);
		return () => clearTimeout(timer);
	}, [query]);

	function handleContainerBlur(e: React.FocusEvent) {
		const relatedTarget = e.relatedTarget as Node | null;
		if (!containerRef.current?.contains(relatedTarget)) {
			setIsFocused(false);
			setActiveOverlay(null);
		}
	}

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setInputValue(value);

		if (value.endsWith(" ") || value === "") {
			const fullQuery = [...parsedFilters.map((f) => f.raw), value].filter(Boolean).join(" ");
			const { filters: detected, remainingText } = parseFilters(fullQuery);

			if (detected.length > parsedFilters.length) {
				setParsedFilters(detected);
				setInputValue(remainingText);
				const matches = getAutocompleteMatches(remainingText, filterKeywords);
				setActiveOverlay(computeOverlay(remainingText, matches.length > 0));
				return;
			}
		}

		const matches = getAutocompleteMatches(value, filterKeywords);
		setActiveOverlay(computeOverlay(value, matches.length > 0));
	}

	function applyAutocomplete(keyword: string) {
		const words = inputValue.split(/\s/);
		words[words.length - 1] = keyword;
		setInputValue(words.join(" "));
		setActiveOverlay("results");
		inputRef.current?.focus();
	}

	function clearSearch() {
		setInputValue("");
		setParsedFilters([]);
		setActiveOverlay(null);
		inputRef.current?.focus();
	}

	function removeFilter(filter: ParsedFilter) {
		setParsedFilters((prev) => prev.filter((f) => f !== filter));
		inputRef.current?.focus();
	}

	function handleInputFocus() {
		setIsFocused(true);
		if (inputValue === "" && parsedFilters.length === 0) {
			setActiveOverlay("autocomplete");
		} else if (query.trim() !== "") {
			setActiveOverlay("results");
		}
	}

	function handleInputClick() {
		if (query.trim() !== "" && activeOverlay !== "autocomplete") {
			setActiveOverlay("results");
		}
	}

	function closeOverlay() {
		setActiveOverlay(null);
	}

	return {
		query,
		searchMode,
		autocompleteOptions,

		inputValue,
		debouncedQuery,
		isFocused,
		parsedFilters,
		activeOverlay,

		containerRef,
		inputRef,

		handleContainerBlur,
		handleInputChange,
		handleInputFocus,
		handleInputClick,
		applyAutocomplete,
		clearSearch,
		removeFilter,
		closeOverlay,
	};
}
