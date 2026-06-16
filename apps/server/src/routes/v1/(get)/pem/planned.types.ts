export type WmsProperties = {
  bs_identity_name: string;
  bs_name: string;
  city: string;
  location_in_city: string;
  date_from: string;
  date_to: string;
  installation_operator_name: string;
  laboratory_name: string;
  laboratory_pca: string;
};
export type WmsFeature = {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: WmsProperties;
};
export type WmsFeatureCollection = {
  type: "FeatureCollection";
  features: WmsFeature[];
};

export type InactiveStationProperties = {
  identity_name?: string | null;
  identity_names?: string | null;
  bs_identity_name?: string | null;
  name?: string | null;
  city?: string | null;
  location_in_city?: string | null;
  address?: string | null;
  installation_operator_name?: string | null;
  operator_name?: string | null;
  operator?: string | null;
  disabling_date?: string | null;
  is_old?: boolean | null;
  is_active?: boolean | null;
};
export type InactiveStationFeature = {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: InactiveStationProperties;
};
export type InactiveStationFeatureCollection = {
  type: "FeatureCollection";
  features: InactiveStationFeature[];
};

export type Lab = { PCA: string; name: string };
export type BaseStation = {
  id: number;
  identity_name: string | null;
  name: string;
  city: string;
  address: string;
  county: string;
  voivodeship: string;
  operator: string;
  longitude: string;
  latitude: string;
  teryt: number;
};
export type PlannedMeasurementResult = {
  id: number;
  base_station: BaseStation;
  date_from: string;
  date_to: string;
  lab: Lab;
  created_at: string;
  modified_at: string;
  status: "PLANNED" | "COMPLETED" | "CANCELED";
  report: string | null;
};
export type PlannedResponse = {
  count: number;
  next: string;
  previous: string | null;
  results: PlannedMeasurementResult[];
};
