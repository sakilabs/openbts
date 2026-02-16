import { useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchApiData, fetchJson, API_BASE } from "@/lib/api";
import { operatorsQueryOptions, bandsQueryOptions, regionsQueryOptions } from "@/features/shared/queries";
import { parseFilters } from "@/features/map/filters";
import type { Station, StationFilters, StationSortBy, StationSortDirection } from "@/types/station";

const FETCH_LIMIT = 120;

type SearchWithFiltersParams = {
	query: string;
	filters: StationFilters;
	regionNames: string[];
};

function buildSearchQuery({ query, filters, regionNames }: SearchWithFiltersParams): string {
	const parsed = parseFilters(query);
	const existingKeys = new Set(parsed.filters.map((f) => f.key));

	const filterParts: string[] = [query];

	if (filters.operators.length && !existingKeys.has("mnc")) filterParts.push(`mnc:${filters.operators.join(",")}`);
	if (filters.bands.length && !existingKeys.has("band")) filterParts.push(`band:${filters.bands.join(",")}`);
	if (filters.rat.length && !existingKeys.has("rat")) filterParts.push(`rat:${filters.rat.join(",")}`);
	if (regionNames.length && !existingKeys.has("region")) filterParts.push(`region:${regionNames.join(",")}`);

	return filterParts.join(" ").trim();
}

const searchStations = async (query: string) => {
	return fetchApiData<Station[]>("search", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query }),
	});
};

type FetchStationsParams = {
	pageParam?: number;
	limit: number;
	filters: StationFilters;
	regionNames: string[];
	sort: StationSortDirection;
	sortBy: StationSortBy | undefined;
};

type StationsResponse = { data: Station[]; totalCount: number };

const fetchStationsList = async (params: FetchStationsParams): Promise<StationsResponse> => {
	const page = params.pageParam ?? 1;
	const searchParams = new URLSearchParams();
	searchParams.set("page", page.toString());
	searchParams.set("limit", params.limit.toString());

	if (params.filters.operators.length) searchParams.set("operators", params.filters.operators.join(","));
	if (params.filters.bands.length) searchParams.set("bands", params.filters.bands.join(","));
	if (params.filters.rat.length) searchParams.set("rat", params.filters.rat.join(","));
	if (params.regionNames.length) searchParams.set("regions", params.regionNames.join(","));
	searchParams.set("sort", params.sort);
	if (params.sortBy) searchParams.set("sortBy", params.sortBy);

	return fetchJson<StationsResponse>(`${API_BASE}/stations?${searchParams.toString()}`);
};

const parseArrayParam = (value: string | null): string[] => {
	if (!value) return [];
	return value.split(",").filter(Boolean);
};

const parseNumberArrayParam = (value: string | null): number[] => {
	if (!value) return [];
	return value
		.split(",")
		.map(Number)
		.filter((n) => !Number.isNaN(n));
};

type FullState = {
	operators: number[];
	bands: number[];
	rat: string[];
	recentOnly: boolean;
	regions: number[];
	q: string;
	order: StationSortDirection;
	sort: StationSortBy | undefined;
};

function stateToParams(state: FullState): URLSearchParams {
	const next = new URLSearchParams();
	if (state.operators.length) next.set("mnc", state.operators.join(","));
	if (state.bands.length) next.set("band", state.bands.join(","));
	if (state.rat.length) next.set("rat", state.rat.join(","));
	if (state.recentOnly) next.set("recent", "1");
	if (state.regions.length) next.set("regions", state.regions.join(","));
	if (state.q) next.set("q", state.q);
	if (state.order !== "desc") next.set("order", state.order);
	if (state.sort && state.sort !== "updatedAt") next.set("sort", state.sort);
	return next;
}

function paramsToState(searchParams: URLSearchParams): FullState {
	return {
		operators: parseNumberArrayParam(searchParams.get("mnc")),
		bands: parseNumberArrayParam(searchParams.get("band")),
		rat: parseArrayParam(searchParams.get("rat")),
		recentOnly: searchParams.get("recent") === "1",
		regions: parseNumberArrayParam(searchParams.get("regions")),
		q: searchParams.get("q") ?? "",
		order: (searchParams.get("order") as StationSortDirection) ?? "desc",
		sort: (searchParams.get("sort") as StationSortBy | undefined) ?? "updatedAt",
	};
}

export function useStationsData() {
	const location = useLocation();
	const navigate = useNavigate();
	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

	const state = useMemo(() => paramsToState(searchParams), [searchParams]);
	const stateRef = useRef(state);
	stateRef.current = state;

	const commit = useCallback(
		(patch: Partial<FullState>) => {
			const merged = { ...stateRef.current, ...patch };
			stateRef.current = merged;
			navigate({ to: ".", search: Object.fromEntries(stateToParams(merged).entries()), replace: true });
		},
		[navigate],
	);

	const filters = useMemo<StationFilters>(
		() => ({
			operators: state.operators,
			bands: state.bands,
			rat: state.rat,
			source: "internal",
			recentOnly: state.recentOnly,
		}),
		[state.operators, state.bands, state.rat, state.recentOnly],
	);

	const selectedRegions = state.regions;
	const searchQuery = state.q;
	const sort = state.order;
	const sortBy = state.sort;

	const setFilters = useCallback(
		(newFilters: StationFilters | ((prev: StationFilters) => StationFilters)) => {
			const current: StationFilters = {
				operators: stateRef.current.operators,
				bands: stateRef.current.bands,
				rat: stateRef.current.rat,
				source: "internal",
				recentOnly: stateRef.current.recentOnly,
			};
			const resolved = typeof newFilters === "function" ? newFilters(current) : newFilters;
			commit({
				operators: resolved.operators,
				bands: resolved.bands,
				rat: resolved.rat,
				recentOnly: resolved.recentOnly,
			});
		},
		[commit],
	);

	const setSelectedRegions = useCallback(
		(value: number[] | ((prev: number[]) => number[])) => {
			const resolved = typeof value === "function" ? value(stateRef.current.regions) : value;
			commit({ regions: resolved });
		},
		[commit],
	);

	const setSearchQuery = useCallback(
		(value: string | ((prev: string) => string)) => {
			const resolved = typeof value === "function" ? value(stateRef.current.q) : value;
			commit({ q: resolved });
		},
		[commit],
	);

	const setSort = useCallback(
		(value: StationSortDirection | ((prev: StationSortDirection) => StationSortDirection)) => {
			const resolved = typeof value === "function" ? value(stateRef.current.order) : value;
			commit({ order: resolved });
		},
		[commit],
	);

	const setSortBy = useCallback(
		(value: StationSortBy | undefined | ((prev: StationSortBy | undefined) => StationSortBy | undefined)) => {
			const resolved = typeof value === "function" ? value(stateRef.current.sort) : value;
			commit({ sort: resolved });
		},
		[commit],
	);

	const { data: operators = [] } = useQuery(operatorsQueryOptions());

	const { data: bands = [] } = useQuery(bandsQueryOptions());

	const { data: regions = [] } = useQuery(regionsQueryOptions());

	const selectedRegionNames = useMemo(() => {
		return selectedRegions.map((id) => regions.find((r) => r.id === id)?.code).filter((code): code is string => Boolean(code));
	}, [selectedRegions, regions]);

	const { data, fetchNextPage, hasNextPage, isLoading, isFetching } = useInfiniteQuery({
		queryKey: ["stations-list", FETCH_LIMIT, filters.operators, filters.bands, filters.rat, selectedRegionNames, sort, sortBy],
		queryFn: ({ pageParam }) =>
			fetchStationsList({
				pageParam,
				limit: FETCH_LIMIT,
				filters,
				regionNames: selectedRegionNames,
				sort,
				sortBy,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			return lastPage.data.length === FETCH_LIMIT ? allPages.length + 1 : undefined;
		},
		staleTime: 1000 * 60 * 5,
		enabled: searchQuery.trim().length === 0,
	});

	const combinedSearchQuery = useMemo(() => {
		if (searchQuery.trim().length === 0) return "";
		return buildSearchQuery({
			query: searchQuery,
			filters,
			regionNames: selectedRegionNames,
		});
	}, [searchQuery, filters, selectedRegionNames]);

	const { data: searchResults = [], isLoading: isSearching } = useQuery({
		queryKey: ["station-search-table", combinedSearchQuery],
		queryFn: () => searchStations(combinedSearchQuery),
		enabled: combinedSearchQuery.length > 0,
		staleTime: 1000 * 60 * 5,
	});

	const stations = useMemo(() => {
		return searchQuery.trim().length > 0 ? searchResults : (data?.pages.flatMap((page) => page.data) ?? []);
	}, [data, searchQuery, searchResults]);

	const totalStationsFromApi = useMemo(() => {
		if (!data?.pages.length) return undefined;
		return data.pages[data.pages.length - 1]?.totalCount;
	}, [data]);

	const uniqueBandValues = useMemo(() => {
		return [...new Set(bands.map((b) => b.value))].sort((a, b) => a - b);
	}, [bands]);

	const activeFilterCount = filters.operators.length + filters.bands.length + filters.rat.length + selectedRegions.length;

	return {
		stations,
		operators,
		regions,
		uniqueBandValues,
		totalStations: totalStationsFromApi,

		filters,
		setFilters,
		selectedRegions,
		setSelectedRegions,
		activeFilterCount,

		sort,
		setSort,
		sortBy,
		setSortBy,

		searchQuery,
		setSearchQuery,

		isLoading: searchQuery.trim().length > 0 ? isSearching : isLoading,
		isFetching,
		hasMore: searchQuery.trim().length > 0 ? false : hasNextPage,
		loadMore: hasNextPage && searchQuery.trim().length === 0 ? fetchNextPage : undefined,
	};
}
