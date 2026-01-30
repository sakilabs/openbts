import { useState, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchApiData } from "@/lib/api";
import { fetchOperators, fetchBands } from "@/features/map/search-api";
import { fetchStats } from "@/features/map/stats-api";
import { parseFilters } from "@/features/map/filters";
import type { Station, Region, StationFilters } from "@/types/station";

const FETCH_LIMIT = 120;

const fetchRegions = () => fetchApiData<Region[]>("regions");

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
};

const fetchStationsList = async (params: FetchStationsParams) => {
	const page = params.pageParam ?? 1;
	const searchParams = new URLSearchParams();
	searchParams.set("page", page.toString());
	searchParams.set("limit", params.limit.toString());

	if (params.filters.operators.length) searchParams.set("operators", params.filters.operators.join(","));
	if (params.filters.bands.length) searchParams.set("bands", params.filters.bands.join(","));
	if (params.filters.rat.length) searchParams.set("rat", params.filters.rat.join(","));
	if (params.regionNames.length) searchParams.set("regions", params.regionNames.join(","));

	return fetchApiData<Station[]>(`stations?${searchParams.toString()}`);
};

export function useStationsData() {
	const [filters, setFilters] = useState<StationFilters>({
		operators: [],
		bands: [],
		rat: [],
		source: "internal",
	});
	const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: operators = [] } = useQuery({
		queryKey: ["operators"],
		queryFn: fetchOperators,
		staleTime: 1000 * 60 * 30,
	});

	const { data: bands = [] } = useQuery({
		queryKey: ["bands"],
		queryFn: fetchBands,
		staleTime: 1000 * 60 * 30,
	});

	const { data: regions = [] } = useQuery({
		queryKey: ["regions"],
		queryFn: fetchRegions,
		staleTime: 1000 * 60 * 30,
	});

	const { data: stats } = useQuery({
		queryKey: ["stats"],
		queryFn: fetchStats,
		staleTime: 1000 * 60 * 5,
	});

	const selectedRegionNames = useMemo(() => {
		return selectedRegions.map((id) => regions.find((r) => r.id === id)?.code).filter((code): code is string => Boolean(code));
	}, [selectedRegions, regions]);

	const { data, fetchNextPage, hasNextPage, isLoading, isFetching } = useInfiniteQuery({
		queryKey: ["stations-list", FETCH_LIMIT, filters.operators, filters.bands, filters.rat, selectedRegionNames],
		queryFn: ({ pageParam }) =>
			fetchStationsList({
				pageParam,
				limit: FETCH_LIMIT,
				filters,
				regionNames: selectedRegionNames,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			return lastPage.length === FETCH_LIMIT ? allPages.length + 1 : undefined;
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
		return searchQuery.trim().length > 0 ? searchResults : (data?.pages.flat() ?? []);
	}, [data, searchQuery, searchResults]);

	const uniqueBandValues = useMemo(() => {
		return [...new Set(bands.map((b) => b.value))].sort((a, b) => a - b);
	}, [bands]);

	const activeFilterCount = filters.operators.length + filters.bands.length + filters.rat.length + selectedRegions.length;

	return {
		stations,
		operators,
		regions,
		uniqueBandValues,
		totalStations: stats?.counts.stations,

		filters,
		setFilters,
		selectedRegions,
		setSelectedRegions,
		activeFilterCount,

		searchQuery,
		setSearchQuery,

		isLoading: searchQuery.trim().length > 0 ? isSearching : isLoading,
		isFetching,
		hasMore: searchQuery.trim().length > 0 ? false : hasNextPage,
		loadMore: hasNextPage && searchQuery.trim().length === 0 ? fetchNextPage : undefined,
	};
}
