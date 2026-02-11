import type { FilterKeyword } from "./types";
import { RAT_ORDER } from "@/features/shared/rat";

export { RAT_ORDER };

export const SOURCE_ID = "stations-source";
export const POINT_LAYER_ID = "stations-layer";

export const POLAND_CENTER: [number, number] = [19.9, 52.0];

export const PICKER_SOURCE_ID = "picker-locations-source";
export const PICKER_CIRCLE_LAYER_ID = "picker-locations-circle";
export const PICKER_SYMBOL_LAYER_ID = "picker-locations-symbol";
export const PICKER_LAYER_IDS = [PICKER_CIRCLE_LAYER_ID, PICKER_SYMBOL_LAYER_ID] as const;

export const PICKER_NEARBY_RADIUS_METERS = 100;

export const RAT_OPTIONS = [
	{ value: "gsm", label: "GSM", gen: "2G" },
	{ value: "umts", label: "UMTS", gen: "3G" },
	{ value: "lte", label: "LTE", gen: "4G" },
	{ value: "5g", label: "NR", gen: "5G" },
	{ value: "iot", label: "IoT", gen: "NB" },
] as const;
export const UKE_RAT_OPTIONS = [
	{ value: "gsm", label: "GSM", gen: "2G" },
	{ value: "gsm-r", label: "GSM-R", gen: "2G" },
	{ value: "cdma", label: "CDMA", gen: "3G" },
	{ value: "umts", label: "UMTS", gen: "3G" },
	{ value: "lte", label: "LTE", gen: "4G" },
	{ value: "5g", label: "NR", gen: "5G" },
	{ value: "iot", label: "IoT", gen: "NB" },
] as const;

export const FILTER_KEYWORDS: FilterKeyword[] = [
	// Station filters
	{ key: "bts_id:", description: "Search station ID (partial match)", availableOn: ["map", "stations"] },
	{ key: "mnc:", description: "Filter by operator MNC code", availableOn: ["map"] },

	// Location filters
	{ key: "region:", description: "Filter by region code (e.g., MAZ, SL, WP)", availableOn: [] },

	// Cell filters
	{ key: "band:", description: "Filter by frequency in MHz (e.g., 800, 1800, 2100)", availableOn: ["map"] },
	{ key: "rat:", description: "Filter by standard (GSM, UMTS, LTE, NR)", availableOn: ["map"] },
	{ key: "is_confirmed:", description: "Filter by confirmation status (true, false)", availableOn: ["map", "stations"] },

	// GSM cell filters
	{ key: "lac:", description: "GSM Location Area Code", availableOn: ["map", "stations"] },
	{ key: "cid:", description: "GSM Cell ID", availableOn: ["map", "stations"] },

	// UMTS cell filters
	{ key: "rnc:", description: "UMTS Radio Network Controller ID", availableOn: ["map", "stations"] },
	{ key: "umts_cid:", description: "UMTS Cell ID", availableOn: ["map", "stations"] },
	{ key: "cid_long:", description: "UMTS Long Cell ID", availableOn: ["map", "stations"] },
	{ key: "umts_lac:", description: "UMTS Location Area Code", availableOn: ["map", "stations"] },

	// LTE cell filters
	{ key: "enbid:", description: "LTE eNodeB ID", availableOn: ["map", "stations"] },
	{ key: "ecid:", description: "LTE E-UTRAN Cell ID", availableOn: ["map", "stations"] },
	{ key: "lte_clid:", description: "LTE Cell Local ID", availableOn: ["map", "stations"] },
	{ key: "tac:", description: "LTE Tracking Area Code", availableOn: ["map", "stations"] },
	{ key: "supports_nb_iot:", description: "Supports NB-IoT (true, false)", availableOn: ["map", "stations"] },

	// NR (5G) cell filters
	{ key: "gnbid:", description: "5G gNodeB ID", availableOn: ["map", "stations"] },
	{ key: "nci:", description: "5G NR Cell Identity", availableOn: ["map", "stations"] },
	{ key: "nr_clid:", description: "5G Cell Local ID", availableOn: ["map", "stations"] },
	{ key: "nrtac:", description: "5G Tracking Area Code", availableOn: ["map", "stations"] },
	{ key: "supports_nr_redcap:", description: "Supports NR RedCap (true, false)", availableOn: ["map", "stations"] },

	// NetWorkS filters
	{ key: "networks_id:", description: "Search by NetWorkS! ID", availableOn: ["map", "stations"] },
	{ key: "networks_name:", description: "Search by NetWorkS! name", availableOn: ["map", "stations"] },
	{ key: "mno_name:", description: "Search by MNO name", availableOn: ["map", "stations"] },
];

export const FILTER_REGEX = /(\w+):\s*(?:'([^']*)'|"([^"]*)"|([^\s]+))(?=\s|$)/gi;
