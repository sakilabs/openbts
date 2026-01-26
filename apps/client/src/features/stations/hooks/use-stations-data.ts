import { useState, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchApiData } from "@/lib/api";
import { fetchOperators, fetchBands } from "@/features/map/search-api";
import type { Station, Region, StationFilters } from "@/types/station";

const FETCH_LIMIT = 120;

const fetchRegions = () => fetchApiData<Region[]>("regions");

const searchStations = async (query: string) => {
	return fetchApiData<Station[]>("search", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query }),
	});
};

const fetchStationsList = async (params: { pageParam?: number; limit: number }) => {
	const page = params.pageParam ?? 1;
	const searchParams = new URLSearchParams();
	searchParams.set("page", page.toString());
	searchParams.set("limit", params.limit.toString());

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

	// Reference data queries
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

	// Stations infinite query (no server-side filtering)
	const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
		queryKey: ["stations-list", FETCH_LIMIT],
		queryFn: ({ pageParam }) =>
			fetchStationsList({
				pageParam,
				limit: FETCH_LIMIT,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			return lastPage.length === FETCH_LIMIT ? allPages.length + 1 : undefined;
		},
		staleTime: 1000 * 60 * 5,
		enabled: searchQuery.trim().length === 0, // Only fetch when not searching
	});

	// Search query for stations
	const { data: searchResults = [], isLoading: isSearching } = useQuery({
		queryKey: ["station-search-table", searchQuery],
		queryFn: () => searchStations(searchQuery),
		enabled: searchQuery.trim().length > 0,
		staleTime: 1000 * 60 * 5,
	});

	// ✅ Good: Calculate stations during rendering with client-side filtering
	const stations = useMemo(() => {
		const rawStations = searchQuery.trim().length > 0 ? searchResults : (data?.pages.flat() ?? []);

		// Apply client-side filters
		return rawStations.filter((station) => {
			// Filter by operator
			if (filters.operators.length > 0 && !filters.operators.includes(station.operator.mnc)) {
				return false;
			}

			// Filter by region
			if (selectedRegions.length > 0) {
				const regionMatches = selectedRegions.some((regionId) => {
					const region = regions.find((r) => r.id === regionId);
					return region?.name === station.location?.region?.name;
				});
				if (!regionMatches) return false;
			}

			// Filter by bands - station must have at least one cell with matching band
			if (filters.bands.length > 0) {
				const hasBand = station.cells?.some((cell) => filters.bands.includes(cell.band?.value));
				if (!hasBand) return false;
			}

			// Filter by RAT - station must have at least one cell with matching RAT
			if (filters.rat.length > 0) {
				const hasRat = station.cells?.some((cell) => {
					const cellRat = cell.rat?.toLowerCase();
					return filters.rat.some((filterRat) => {
						// Map filter values to cell RAT values
						if (filterRat === "5g" && cellRat === "nr") return true;
						return cellRat === filterRat;
					});
				});
				if (!hasRat) return false;
			}

			return true;
		});
	}, [data, searchQuery, searchResults, filters.operators, filters.bands, filters.rat, selectedRegions, regions]);

	const uniqueBandValues = useMemo(() => {
		return [...new Set(bands.map((b) => b.value))].sort((a, b) => a - b);
	}, [bands]);

	const activeFilterCount = filters.operators.length + filters.bands.length + filters.rat.length + selectedRegions.length;

	return {
		// Data
		stations,
		operators,
		regions,
		uniqueBandValues,

		// Filter state
		filters,
		setFilters,
		selectedRegions,
		setSelectedRegions,
		activeFilterCount,

		// Search state
		searchQuery,
		setSearchQuery,

		// Loading state
		isLoading: searchQuery.trim().length > 0 ? isSearching : isLoading,
		hasMore: searchQuery.trim().length > 0 ? false : hasNextPage,
		loadMore: hasNextPage && searchQuery.trim().length === 0 ? fetchNextPage : undefined,
	};
}
