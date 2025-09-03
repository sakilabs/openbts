export interface LegacyRegionRow {
	id: number;
	name: string;
	country_code: string;
	code: string;
}

export interface LegacyNetworkRow {
	code: string;
	name: string;
	operator_name: string;
	country_code: string;
}

export interface LegacyLocationRow {
	id: number;
	region_id: number;
	town: string;
	address: string;
	latitude: string;
	longitude: string;
	location_hash: string;
	date_added: string;
	date_updated: string;
}

export interface LegacyBaseStationRow {
	id: number;
	network_id: string;
	location_id: number;
	location_details: string;
	station_id: string;
	rnc: number;
	is_common_bcch: number;
	is_gsm: number;
	is_umts: number;
	is_cdma: number;
	is_lte: number;
	is_5g: number;
	notes: string;
	station_status: string;
	edit_status: string;
	date_added: string;
	date_updated: string;
	is_networks: number;
	enbi: number;
}

export interface LegacyCellRow {
	id: number;
	base_station_id: number;
	standard: string;
	band: string;
	duplex: string;
	ua_freq: number;
	lac: number | null;
	cid: number | null;
	cid_long: number | null;
	azimuth: number | null;
	is_confirmed: number;
	notes: string;
	date_added: string;
	date_updated: string;
	date_ping: string | null;
}

export interface LegacyUkeLocationRow {
	id: number;
	latitude: number;
	longitude: number;
	latitude_uke: string;
	longitude_uke: string;
	location_hash: string;
	date_added: string;
}

export interface LegacyUkeOperatorRow {
	id: number;
	operator_name: string;
	network_id: string;
}

export interface LegacyUkePermissionRow {
	id: number;
	location_id: number;
	operator_id: number;
	station_id: string;
	standard: string;
	band: string;
	town: string;
	address: string;
	case_number: string;
	case_type: string;
	expiry_date: string;
	date_added: string;
	date_updated: string;
	network_id: string;
	case_number_orig: string;
}

export interface LegacyBaseStationPermissionRow {
	id: number;
	base_station_id: number;
	permission_id: number;
	station_id: string;
}
