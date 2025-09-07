import type { LegacyBaseStationRow, LegacyCellRow, LegacyLocationRow, LegacyNetworkRow, LegacyRegionRow } from "../legacyTypes.js";
import { mapDuplex, mapStandardToRat, stripNotes, toInt, type Rat } from "../utils.js";

export interface PreparedRegion {
	name: string;
}
export interface PreparedOperator {
	name: string;
	full_name: string;
	mnc: number;
	is_isp: boolean;
}
export interface PreparedLocation {
	original_id: number;
	region_name: string;
	city: string | null;
	address: string | null;
	longitude: number;
	latitude: number;
	date_added: Date | null;
	date_updated: Date | null;
}
export interface PreparedStation {
	original_id: number;
	operator_mnc: number;
	location_original_id: number;
	station_id: string;
	notes: string | null;
	status: "published" | "inactive" | "pending";
	is_confirmed: boolean;
	date_added: Date | null;
	date_updated: Date | null;
}
export interface PreparedBandKey {
	rat: Rat;
	value: number;
	duplex: "FDD" | "TDD" | null;
}

export interface PreparedCellBase {
	original_id: number;
	station_original_id: number;
	band_key: PreparedBandKey;
	rat: Rat;
	notes: string | null;
	is_confirmed: boolean;
	date_added: Date | null;
	date_updated: Date | null;
}
export interface PreparedGSMDetails {
	lac: number | null;
	cid: number | null;
	e_gsm: boolean;
}
export interface PreparedUMTSDetails {
	lac: number | null;
	rnc: number;
	cid: number;
}
export interface PreparedLTEDetails {
	tac: number | null;
	enbid: number;
	clid: number;
	supports_nb_iot: boolean;
}
export interface PreparedNRDetails {
	nrtac: number | null;
	gnbid: number | null;
	clid: number;
	supports_nr_redcap: boolean;
}

export type PreparedCell =
	| (PreparedCellBase & { rat: "GSM"; gsm: PreparedGSMDetails })
	| (PreparedCellBase & { rat: "UMTS"; umts: PreparedUMTSDetails })
	| (PreparedCellBase & { rat: "LTE"; lte: PreparedLTEDetails })
	| (PreparedCellBase & { rat: "NR"; nr: PreparedNRDetails });

export function prepareRegions(rows: LegacyRegionRow[]): PreparedRegion[] {
	return rows.map((r) => ({ name: r.name }));
}

export function prepareOperators(rows: LegacyNetworkRow[]): PreparedOperator[] {
	return rows
		.map((n) => ({
			name: n.name.trim(),
			full_name: n.operator_name.trim(),
			mnc: Number(String(n.code).trim()),
			is_isp: true,
		}))
		.filter((r) => Number.isFinite(r.mnc));
}

export function prepareLocations(rows: LegacyLocationRow[], regions: LegacyRegionRow[]): PreparedLocation[] {
	const regionById = new Map<number, LegacyRegionRow>();
	for (const reg of regions) regionById.set(reg.id, reg);
	return rows
		.filter((loc) => !(loc.address === "" && loc.town === "" && loc.latitude === "0.000000" && loc.longitude === "0.000000"))
		.map((loc) => ({
			original_id: loc.id,
			region_name: regionById.get(loc.region_id)?.name ?? "",
			city: loc.town?.trim() || null,
			address: loc.address?.trim() || null,
			longitude: toInt(loc.longitude) ?? 0,
			latitude: toInt(loc.latitude) ?? 0,
			date_added: new Date(loc.date_added),
			date_updated: new Date(loc.date_updated),
		}));
}

export function prepareStations(rows: LegacyBaseStationRow[]): PreparedStation[] {
	return rows
		.filter((station) => !(station.station_id === ""))
		.map((station) => ({
			original_id: station.id,
			operator_mnc: Number(String(station.network_id).trim()),
			location_original_id: station.location_id,
			station_id: station.station_id.replace(/\?,/g, ""),
			notes: station.notes ? stripNotes(station.notes.trim(), [/\bnetworks?\b/gi]) : null,
			status: normalizeStatus(station.station_status),
			is_confirmed: station.edit_status.toLowerCase() === "published",
			date_added: new Date(station.date_added),
			date_updated: new Date(station.date_updated),
		}));
}

export function prepareBands(cells: LegacyCellRow[]): PreparedBandKey[] {
	const keys: PreparedBandKey[] = [];
	for (const cell of cells) {
		const rat = mapStandardToRat(cell.standard || "");
		if (!rat) continue;
		const value = toInt(cell.band) ?? 0;
		if (!value) continue;
		const duplex = mapDuplex(cell.duplex);
		keys.push({ rat, value, duplex });
	}
	const seen = new Set<string>();
	const out: PreparedBandKey[] = [];
	for (const key of keys) {
		const id = `${key.rat}:${key.value}:${key.duplex ?? ""}`;
		if (seen.has(id)) continue;
		seen.add(id);
		out.push(key);
	}
	return out;
}

export function prepareCells(rows: LegacyCellRow[], basestationsById: Map<number, LegacyBaseStationRow>): PreparedCell[] {
	const out: PreparedCell[] = [];
	for (const cell of rows) {
		const rat = mapStandardToRat(cell.standard || "");
		if (!rat) continue;
		const station = basestationsById.get(cell.base_station_id);
		if (!station) continue;
		const band_key: PreparedBandKey = {
			rat,
			value: toInt(cell.band) ?? 0,
			duplex: mapDuplex(cell.duplex),
		};
		if (!band_key.value) continue;
		const base: PreparedCellBase = {
			original_id: cell.id,
			station_original_id: cell.base_station_id,
			band_key,
			rat,
			notes: cell.notes ? stripNotes(cell.notes?.trim(), [/\bnetworks?\b/gi, /\b[E-GSM]\b/gi]) : null,
			is_confirmed: cell.is_confirmed === 1,
			date_added: new Date(cell.date_added),
			date_updated: new Date(cell.date_updated),
		};
		if (rat === "GSM") {
			out.push({ ...base, rat, gsm: { lac: toInt(cell.lac), cid: toInt(cell.cid), e_gsm: cell.notes?.includes("[E-GSM]") ?? false } });
			continue;
		}
		if (rat === "UMTS") {
			const rnc = toInt(station.rnc) ?? 0;
			const cid = toInt(cell.cid) ?? 0;
			if (!rnc || !cid) continue;
			out.push({ ...base, rat, umts: { lac: toInt(cell.lac), rnc, cid } });
			continue;
		}
		if (rat === "LTE") {
			const enbid = toInt(station.enbi) ?? 0;
			const tac = toInt(cell.lac) ?? null;
			let clid = toInt(cell.cid) ?? 0;
			if (clid < 0) clid = 0;
			if (clid > 255) clid = clid % 256;
			if (!enbid || !clid) continue;
			out.push({ ...base, rat, lte: { tac, enbid, clid, supports_nb_iot: false } });
			continue;
		}
		if (rat === "NR") {
			const gnbid = toInt(station.enbi) ?? null;
			const clid = toInt(cell.cid) ?? 0;
			if (!clid) continue;
			out.push({ ...base, rat, nr: { nrtac: null, gnbid, clid, supports_nr_redcap: false } });
		}
	}
	return out;
}

function normalizeStatus(status: string | null | undefined): "published" | "inactive" | "pending" {
	const val = (status || "").toLowerCase();
	if (val.includes("onair") || val.includes("published")) return "published";
	if (val.includes("inactive") || val.includes("off")) return "inactive";
	return "pending";
}
