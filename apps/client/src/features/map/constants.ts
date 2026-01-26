import type { FilterKeyword } from "./types";

// Map layer constants
export const SOURCE_ID = "stations-source";
export const POINT_LAYER_ID = "stations-layer";

export const RAT_OPTIONS = [
	{ value: "gsm", label: "GSM", gen: "2G" },
	{ value: "umts", label: "UMTS", gen: "3G" },
	{ value: "lte", label: "LTE", gen: "4G" },
	{ value: "5g", label: "NR", gen: "5G" },
	{ value: "iot", label: "IoT", gen: "NB" },
] as const;

// Available filter keywords for autocomplete (based on backend FILTER_DEFINITIONS)
export const FILTER_KEYWORDS: FilterKeyword[] = [
	// Station filters
	{ key: "station_id:", description: "Exact station ID match (comma-separated)" },
	{ key: "bts_id:", description: "Search station ID (partial match)" },
	{ key: "mnc:", description: "Filter by operator MNC code" },

	// Cell filters
	{ key: "band_id:", description: "Filter by band ID" },
	{ key: "band:", description: "Filter by frequency in MHz (e.g., 800, 1800, 2100)" },
	{ key: "rat:", description: "Filter by standard (GSM, UMTS, LTE, NR)" },
	{ key: "is_confirmed:", description: "Filter by confirmation status (true, false)" },

	// GSM cell filters
	{ key: "lac:", description: "GSM Location Area Code" },
	{ key: "cid:", description: "GSM Cell ID" },

	// UMTS cell filters
	{ key: "rnc:", description: "UMTS Radio Network Controller ID" },
	{ key: "umts_cid:", description: "UMTS Cell ID" },
	{ key: "cid_long:", description: "UMTS Long Cell ID" },
	{ key: "umts_lac:", description: "UMTS Location Area Code" },

	// LTE cell filters
	{ key: "enbid:", description: "LTE eNodeB ID" },
	{ key: "ecid:", description: "LTE E-UTRAN Cell ID" },
	{ key: "lte_clid:", description: "LTE Cell Local ID" },
	{ key: "tac:", description: "LTE Tracking Area Code" },
	{
		key: "supports_nb_iot:",
		description: "Supports NB-IoT (true, false)",
	},

	// NR (5G) cell filters
	{ key: "gnbid:", description: "5G gNodeB ID" },
	{ key: "nci:", description: "5G NR Cell Identity" },
	{ key: "nr_clid:", description: "5G Cell Local ID" },
	{ key: "nrtac:", description: "5G Tracking Area Code" },
	{
		key: "supports_nr_redcap:",
		description: "Supports NR RedCap (true, false)",
	},
];

// Regex to match filter syntax - only match complete filters (with space after or at end)
export const FILTER_REGEX = /(\w+):\s*(?:'([^']*)'|"([^"]*)"|([^\s]+))(?=\s|$)/gi;
