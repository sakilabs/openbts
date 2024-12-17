export interface BTSStation {
	bts_id: number;
	owner: number;
	region: number;
	mno_id: number | null;
	networks_id: number;
	type: string | null;
	longitude: string;
	latitude: string;
	location_type: string | null;
}

export interface ExtraBTSStation {
	bts_id: number;
	city: string | null;
	street: string | null;
	street_number: string | null;
	municipality: string | null;
	district: string | null;
	province: string | null;
	cluster: number;
}

export interface BTSStationNotes {
	comment_id?: number;
	bts_id: number;
	content?: string;
	datePosted: string;
	author: {
		id: number;
		name: string;
	};
	attachments?: string[];
}

export interface BTSStationData extends BTSStation {
	mno?: {
		mno_id: number;
		mno_name?: string;
	};
	networks?: {
		networks_id: number;
		networks_name?: string;
	};
}
