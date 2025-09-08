import { eq, inArray, and, or } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import {
	bands,
	cells,
	gsmCells,
	locations,
	lteCells,
	nrCells,
	operators,
	regions,
	stations,
	umtsCells,
	type ratEnum,
	type DuplexType,
} from "@openbts/drizzle";
import * as schema from "@openbts/drizzle";
import type { PreparedBandKey, PreparedCell, PreparedLocation, PreparedOperator, PreparedRegion, PreparedStation } from "./transformers.js";

export interface RegionIdMap extends Map<string, number> {}
export interface OperatorIdMap extends Map<number, number> {}
export interface LocationIdMap extends Map<number, number> {}
export interface StationIdMap extends Map<number, number> {}
export interface BandIdKey {
	rat: (typeof ratEnum.enumValues)[number];
	value: number;
	duplex: (typeof DuplexType.enumValues)[number] | null;
}
export interface BandIdMap extends Map<string, number> {}
export interface CellIdMap extends Map<number, number> {}

function bandKeyId(k: BandIdKey): string {
	return `${k.rat}:${k.value}:${k.duplex ?? ""}`;
}

interface WriteOptions {
	batchSize?: number;
	onProgress?: (processed: number) => void;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
	if (!size || size <= 0 || size === Number.POSITIVE_INFINITY) return [arr];
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}

const url = process.env.DATABASE_URL as string;
if (!url) {
	throw new Error("DATABASE_URL is not set");
}

export const sql = postgres(url);
export const db = drizzle({ client: sql, schema });
export type Database = typeof db;

export async function writeRegions(items: PreparedRegion[], options: WriteOptions = {}): Promise<RegionIdMap> {
	const unique = new Map<string, PreparedRegion>();
	for (const region of items) unique.set(region.name, region);
	const dedup = [...unique.values()];
	const batchSize = options.batchSize ?? dedup.length;
	if (dedup.length) {
		for (const group of chunkArray(dedup, batchSize)) {
			if (group.length === 0) continue;
			await db
				.insert(regions)
				.values(group.map((r) => ({ name: r.name })))
				.onConflictDoNothing({ target: [regions.name] });
			options.onProgress?.(group.length);
		}
	}
	const names = dedup.map((region) => region.name);
	const rows = names.length ? await db.query.regions.findMany({ where: inArray(regions.name, names) }) : [];
	const map: RegionIdMap = new Map();
	for (const row of rows) map.set(row.name, row.id);
	return map;
}

export async function writeOperators(items: PreparedOperator[], options: WriteOptions = {}): Promise<OperatorIdMap> {
	const unique = new Map<number, PreparedOperator>();
	for (const operator of items) unique.set(operator.mnc, operator);
	const dedup = [...unique.values()];
	const batchSize = options.batchSize ?? dedup.length;
	if (dedup.length) {
		for (const group of chunkArray(dedup, batchSize)) {
			if (group.length === 0) continue;
			await db
				.insert(operators)
				.values(group.map((o) => ({ name: o.name, full_name: o.full_name, mnc: o.mnc, is_isp: o.is_isp })))
				.onConflictDoNothing({ target: [operators.mnc] });
			options.onProgress?.(group.length);
		}
	}
	const mncs = dedup.map((operator) => operator.mnc);
	const rows = mncs.length ? await db.query.operators.findMany({ where: inArray(operators.mnc, mncs) }) : [];
	const map: OperatorIdMap = new Map();
	for (const row of rows) map.set(row.mnc ?? 0, row.id);
	return map;
}

export async function updateOperatorParents(): Promise<void> {
	const relevant = ["NetWorkS!", "T-Mobile", "Orange", "Plus", "Aero 2", "Sferia"] as const;
	const rows = await db.query.operators.findMany({ where: inArray(operators.name, relevant as unknown as string[]) });
	const nameToId = new Map<string, number>();
	for (const operator of rows) nameToId.set(operator.name, operator.id);

	const parentOfNetworks = nameToId.get("NetWorkS!");
	const parentOfPlus = nameToId.get("Plus");

	const updates: Array<{ child: number; parent: number }> = [];
	const tmobile = nameToId.get("T-Mobile");
	if (tmobile && parentOfNetworks) updates.push({ child: tmobile, parent: parentOfNetworks });
	const orange = nameToId.get("Orange");
	if (orange && parentOfNetworks) updates.push({ child: orange, parent: parentOfNetworks });
	const aero2 = nameToId.get("Aero 2");
	if (aero2 && parentOfPlus) updates.push({ child: aero2, parent: parentOfPlus });
	const sferia = nameToId.get("Sferia");
	if (sferia && parentOfPlus) updates.push({ child: sferia, parent: parentOfPlus });

	for (const update of updates) {
		await db.update(operators).set({ parent_id: update.parent }).where(eq(operators.id, update.child));
	}
}

export async function writeLocations(items: PreparedLocation[], regionIds: RegionIdMap, options: WriteOptions = {}): Promise<LocationIdMap> {
	const withRegions = items
		.map((location) => ({ original: location, regionId: regionIds.get(location.region_name) }))
		.filter((item): item is { original: PreparedLocation; regionId: number } => typeof item.regionId === "number");

	const values = withRegions.map((item) => ({
		region_id: item.regionId,
		city: item.original.city ?? undefined,
		address: item.original.address ?? undefined,
		longitude: item.original.longitude,
		latitude: item.original.latitude,
		createdAt: item.original.date_added ?? undefined,
		updatedAt: item.original.date_updated ?? undefined,
	}));

	const batchSize = options.batchSize ?? values.length;
	const inserted: Array<{ id: number }> = [];
	if (values.length) {
		for (const group of chunkArray(values, batchSize)) {
			if (group.length === 0) continue;
			const part = await db
				.insert(locations)
				.values(group)
				.returning({ id: locations.id })
				.onConflictDoNothing({ target: [locations.longitude, locations.latitude] });
			inserted.push(...part);
			options.onProgress?.(group.length);
		}
	}

	const map: LocationIdMap = new Map();
	for (let i = 0; i < withRegions.length; i++) {
		const insert = inserted[i];
		const region = withRegions[i];
		if (insert && region) map.set(region.original.original_id, insert.id);
	}
	return map;
}

export async function writeStations(
	items: PreparedStation[],
	operatorIds: OperatorIdMap,
	locationIds: LocationIdMap,
	options: WriteOptions = {},
): Promise<StationIdMap> {
	const values = items.map((station) => ({
		station_id: station.station_id,
		location_id: locationIds.get(station.location_original_id) ?? null,
		operator_id: operatorIds.get(station.operator_mnc) ?? null,
		notes: station.notes ?? undefined,
		status: station.status,
		is_confirmed: station.is_confirmed,
		createdAt: station.date_added ?? undefined,
		updatedAt: station.date_updated ?? undefined,
	}));
	const batchSize = options.batchSize ?? values.length;
	const inserted: Array<{ id: number }> = [];
	if (values.length) {
		for (const group of chunkArray(values, batchSize)) {
			if (group.length === 0) continue;
			const part = await db
				.insert(stations)
				.values(group)
				.returning({ id: stations.id })
				.onConflictDoNothing({ target: [stations.station_id, stations.operator_id] });
			inserted.push(...part);
			options.onProgress?.(group.length);
		}
	}
	const map: StationIdMap = new Map();
	for (let i = 0; i < items.length; i++) {
		const insert = inserted[i];
		const item = items[i];
		if (insert && item) map.set(item.original_id, insert.id);
	}
	return map;
}

export async function writeBands(keys: PreparedBandKey[], options: WriteOptions = {}): Promise<BandIdMap> {
	const normKeys: BandIdKey[] = keys.map((band) => ({
		rat: band.rat,
		value: band.value,
		duplex: band.duplex,
		name: `${band.rat.toUpperCase()} ${band.value}${band.duplex ? ` (${band.duplex})` : ""}`,
	}));
	const unique = new Map<string, BandIdKey>();
	for (const band of normKeys) unique.set(bandKeyId(band), band);
	const dedup = [...unique.values()];
	const batchSize = options.batchSize ?? dedup.length;
	if (dedup.length) {
		for (const group of chunkArray(dedup, batchSize)) {
			if (group.length === 0) continue;
			await db
				.insert(bands)
				.values(
					group.map((band) => ({
						rat: band.rat,
						value: band.value,
						duplex: band.duplex,
						name: `${band.rat.toUpperCase()} ${band.value}${band.duplex ? ` (${band.duplex})` : ""}`,
					})),
				)
				.onConflictDoNothing();
			options.onProgress?.(group.length);
		}
	}
	const rows = dedup.length ? await db.query.bands.findMany() : [];
	const map: BandIdMap = new Map();
	for (const band of rows) {
		map.set(bandKeyId({ rat: band.rat, value: band.value ?? 0, duplex: band.duplex }), band.id);
	}

	return map;
}

export async function writeCells(
	items: PreparedCell[],
	stationIds: StationIdMap,
	bandIds: BandIdMap,
	options: WriteOptions = {},
): Promise<CellIdMap> {
	const baseValues = items.map((cell) => ({
		station_id: stationIds.get(cell.station_original_id) ?? 0,
		band_id: bandIds.get(bandKeyId({ rat: cell.band_key.rat, value: cell.band_key.value, duplex: cell.band_key.duplex })) ?? 0,
		rat: cell.rat,
		notes: cell.notes ?? undefined,
		is_confirmed: cell.is_confirmed,
		createdAt: cell.date_added ?? undefined,
		updatedAt: cell.date_updated ?? undefined,
	}));
	const batchSize = options.batchSize ?? baseValues.length;
	const inserted: Array<{ id: number }> = [];
	if (baseValues.length) {
		for (const group of chunkArray(baseValues, batchSize)) {
			if (group.length === 0) continue;
			const part = await db.insert(cells).values(group).returning({ id: cells.id });
			inserted.push(...part);
			options.onProgress?.(group.length);
		}
	}
	const idMap: CellIdMap = new Map();
	for (let i = 0; i < items.length; i++) {
		const insert = inserted[i];
		const item = items[i];
		if (insert && item) idMap.set(item.original_id, insert.id);
	}
	return idMap;
}

export async function writeRatDetails(items: PreparedCell[], cellIds: CellIdMap, options: WriteOptions = {}): Promise<void> {
	const gsm = items
		.filter((cell): cell is Extract<PreparedCell, { rat: "GSM" }> => cell.rat === "GSM")
		.map((cell) => ({ id: cellIds.get(cell.original_id) ?? 0, details: cell.gsm }));
	const umts = items
		.filter((cell): cell is Extract<PreparedCell, { rat: "UMTS" }> => cell.rat === "UMTS")
		.map((cell) => ({ id: cellIds.get(cell.original_id) ?? 0, details: cell.umts }));
	const lte = items
		.filter((cell): cell is Extract<PreparedCell, { rat: "LTE" }> => cell.rat === "LTE")
		.map((cell) => ({ id: cellIds.get(cell.original_id) ?? 0, details: cell.lte }));
	const nr = items
		.filter((cell): cell is Extract<PreparedCell, { rat: "NR" }> => cell.rat === "NR")
		.map((cell) => ({ id: cellIds.get(cell.original_id) ?? 0, details: cell.nr }));

	const gsmValues = gsm
		.filter((val) => val.id && val.details.lac != null && val.details.cid != null)
		.map((cell) => ({ cell_id: cell.id, lac: cell.details.lac as number, cid: cell.details.cid as number, e_gsm: cell.details.e_gsm }));
	if (gsmValues.length) {
		for (const group of chunkArray(gsmValues, options.batchSize ?? gsmValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(gsmCells)
				.values(group)
				.onConflictDoNothing({ target: [gsmCells.lac, gsmCells.cid] });
			options.onProgress?.(group.length);
		}
	}

	const umtsValues = umts.map((cell) => ({ cell_id: cell.id, lac: cell.details.lac, rnc: cell.details.rnc, cid: cell.details.cid }));
	if (umtsValues.length) {
		for (const group of chunkArray(umtsValues, options.batchSize ?? umtsValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(umtsCells)
				.values(group)
				.onConflictDoNothing({ target: [umtsCells.rnc, umtsCells.cid] });
			options.onProgress?.(group.length);
		}
	}

	const lteValues = lte.map((cell) => ({
		cell_id: cell.id,
		tac: cell.details.tac,
		enbid: cell.details.enbid,
		clid: cell.details.clid,
		supports_nb_iot: cell.details.supports_nb_iot,
	}));
	if (lteValues.length) {
		for (const group of chunkArray(lteValues, options.batchSize ?? lteValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(lteCells)
				.values(group)
				.onConflictDoNothing({ target: [lteCells.enbid, lteCells.clid] });
			options.onProgress?.(group.length);
		}
	}

	const nrValues = nr.map((cell) => ({
		cell_id: cell.id,
		nrtac: cell.details.nrtac,
		gnbid: cell.details.gnbid,
		clid: cell.details.clid,
		supports_nr_redcap: cell.details.supports_nr_redcap,
	}));
	if (nrValues.length) {
		for (const group of chunkArray(nrValues, options.batchSize ?? nrValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(nrCells)
				.values(group)
				.onConflictDoNothing({ target: [nrCells.gnbid, nrCells.clid] });
			options.onProgress?.(group.length);
		}
	}
}
