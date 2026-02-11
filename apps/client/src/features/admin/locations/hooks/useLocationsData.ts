import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { operatorsQueryOptions, regionsQueryOptions } from "@/features/shared/queries";
import { fetchLocationsList } from "../api";
import type { LocationSortBy, LocationSortDirection } from "@/types/station";

const FETCH_LIMIT = 100;

const parseNumberArrayParam = (value: string | null): number[] => {
	if (!value) return [];
	return value
		.split(",")
		.map(Number)
		.filter((n) => !Number.isNaN(n));
};

export type LocationFilters = {
	operators: number[];
};

export function useLocationsData() {
	const [searchParams, setSearchParams] = useSearchParams();

	const selectedRegions = useMemo(() => parseNumberArrayParam(searchParams.get("regions")), [searchParams]);
	const searchQuery = searchParams.get("q") ?? "";

	const filters = useMemo<LocationFilters>(
		() => ({
			operators: parseNumberArrayParam(searchParams.get("mnc")),
		}),
		[searchParams],
	);

	const sort = useMemo<LocationSortDirection>(() => (searchParams.get("order") as LocationSortDirection) ?? "desc", [searchParams]);

	const sortBy = useMemo<LocationSortBy | undefined>(() => (searchParams.get("sort") as LocationSortBy | undefined) ?? "updatedAt", [searchParams]);

	const setFilters = useCallback(
		(newFilters: LocationFilters | ((prev: LocationFilters) => LocationFilters)) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				const current: LocationFilters = {
					operators: parseNumberArrayParam(next.get("mnc")),
				};
				const resolved = typeof newFilters === "function" ? newFilters(current) : newFilters;

				if (resolved.operators.length) next.set("mnc", resolved.operators.join(","));
				else next.delete("mnc");

				return next;
			});
		},
		[setSearchParams],
	);

	const setSelectedRegions = useCallback(
		(value: number[] | ((prev: number[]) => number[])) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				const current = parseNumberArrayParam(next.get("regions"));
				const resolved = typeof value === "function" ? value(current) : value;
				if (resolved.length) next.set("regions", resolved.join(","));
				else next.delete("regions");
				return next;
			});
		},
		[setSearchParams],
	);

	const setSearchQuery = useCallback(
		(value: string) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				if (value) next.set("q", value);
				else next.delete("q");
				return next;
			});
		},
		[setSearchParams],
	);

	const setSort = useCallback(
		(value: LocationSortDirection | ((prev: LocationSortDirection) => LocationSortDirection)) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				const current = (next.get("order") as LocationSortDirection) ?? "desc";
				const resolved = typeof value === "function" ? value(current) : value;
				next.set("order", resolved);
				return next;
			});
		},
		[setSearchParams],
	);

	const setSortBy = useCallback(
		(value: LocationSortBy | undefined | ((prev: LocationSortBy | undefined) => LocationSortBy | undefined)) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				const current = (next.get("sort") as LocationSortBy | undefined) ?? undefined;
				const resolved = typeof value === "function" ? value(current) : value;
				if (resolved) next.set("sort", resolved);
				else next.delete("sort");
				return next;
			});
		},
		[setSearchParams],
	);

	const { data: operators = [] } = useQuery(operatorsQueryOptions());
	const { data: regions = [] } = useQuery(regionsQueryOptions());

	const selectedRegionCodes = useMemo(() => {
		return selectedRegions.map((id) => regions.find((r) => r.id === id)?.code).filter((code): code is string => Boolean(code));
	}, [selectedRegions, regions]);

	const { data, fetchNextPage, hasNextPage, isLoading, isFetching } = useInfiniteQuery({
		queryKey: ["admin-locations-list", FETCH_LIMIT, filters.operators, selectedRegionCodes, sort, sortBy],
		queryFn: ({ pageParam }) =>
			fetchLocationsList({
				page: pageParam,
				limit: FETCH_LIMIT,
				regions: selectedRegionCodes.length ? selectedRegionCodes.join(",") : undefined,
				operators: filters.operators.length ? filters.operators.join(",") : undefined,
				sort,
				sortBy,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			return lastPage.data.length === FETCH_LIMIT ? allPages.length + 1 : undefined;
		},
		staleTime: 1000 * 60 * 5,
	});

	const allLocations = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) ?? [];
	}, [data]);

	const locations = useMemo(() => {
		if (!searchQuery.trim()) return allLocations;
		const q = searchQuery.toLowerCase();
		return allLocations.filter(
			(loc) => loc.city?.toLowerCase().includes(q) || loc.address?.toLowerCase().includes(q) || loc.id.toString().includes(q),
		);
	}, [allLocations, searchQuery]);

	const totalLocations = useMemo(() => {
		if (!data?.pages.length) return undefined;
		return data.pages[data.pages.length - 1]?.totalCount;
	}, [data]);

	const activeFilterCount = filters.operators.length + selectedRegions.length;

	return {
		locations,
		operators,
		regions,
		totalLocations,
		filters,
		setFilters,
		selectedRegions,
		setSelectedRegions,
		activeFilterCount,
		searchQuery,
		setSearchQuery,
		sort,
		sortBy,
		setSort,
		setSortBy,
		isLoading,
		isFetching,
		hasMore: hasNextPage,
		loadMore: hasNextPage ? fetchNextPage : undefined,
	};
}
