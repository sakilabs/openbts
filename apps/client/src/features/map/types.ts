export type OSMResult = {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
	type: string;
	addresstype?: string;
	address: {
		city?: string;
		town?: string;
		village?: string;
		road?: string;
		suburb?: string;
	};
};

export type ParsedFilter = {
	key: string;
	value: string;
	raw: string;
};

export type FilterKeyword = {
	key: string;
	description: string;
	availableOn: ("map" | "stations")[];
};
