import { fetchApiData } from "@/lib/api";

export type DataStats = {
	lastUpdated: {
		stations: string | null;
		stations_permits: string | null;
		radiolines: string | null;
	};
	counts: {
		locations: number;
		stations: number;
		cells: number;
		uke_locations: number;
		uke_permits: number;
	};
};

export const fetchStats = () => fetchApiData<DataStats>("stats");
