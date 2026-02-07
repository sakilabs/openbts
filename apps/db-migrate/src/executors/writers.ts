import { eq, inArray } from "drizzle-orm";

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
	type BandVariant,
} from "@openbts/drizzle";
import { sql, db } from "@openbts/drizzle/db";
import type { Database } from "@openbts/drizzle/db";
import type { PreparedBandKey, PreparedCell, PreparedLocation, PreparedOperator, PreparedRegion, PreparedStation } from "./transformers.js";

export interface RegionIdMap extends Map<string, number> {}
export interface OperatorIdMap extends Map<number, number> {}
export interface LocationIdMap extends Map<number, number> {}
export interface StationIdMap extends Map<number, number> {}
export interface BandIdKey {
	rat: (typeof ratEnum.enumValues)[number];
	value: number;
	duplex: (typeof DuplexType.enumValues)[number] | null;
	variant?: (typeof BandVariant.enumValues)[number];
}
export interface BandIdMap extends Map<string, number> {}
export interface CellIdMap extends Map<number, number> {}

function bandKeyId(k: BandIdKey): string {
	return `${k.rat}:${k.value}:${k.duplex ?? ""}`;
}

interface WriteOptions {
	batchSize?: number;
	onProgress?: (processed: number) => void;
	onBeginPhase?: (phase: "base" | "GSM" | "UMTS" | "LTE" | "NR", total: number) => void;
	onPhase?: (phase: "base" | "GSM" | "UMTS" | "LTE" | "NR", processed: number) => void;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
	if (!size || size <= 0 || size === Number.POSITIVE_INFINITY) return [arr];
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}

export { sql, db };
export type { Database };

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
				.values(group.map((r) => ({ name: r.name, code: r.code })))
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
				.values(group.map((o) => ({ name: o.name, full_name: o.full_name, mnc: o.mnc })))
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
	const prepared = items.map((station) => ({
		station,
		operatorId: operatorIds.get(station.operator_mnc) ?? (null as number | null),
		locationId: locationIds.get(station.location_original_id) ?? (null as number | null),
	}));

	const values = prepared.map((p) => ({
		station_id: p.station.station_id,
		location_id: p.locationId,
		operator_id: p.operatorId,
		notes: p.station.notes ?? undefined,
		status: p.station.status,
		is_confirmed: p.station.is_confirmed,
		createdAt: p.station.date_added ?? undefined,
		updatedAt: p.station.date_updated ?? undefined,
	}));
	const batchSize = options.batchSize ?? values.length;
	if (values.length) {
		for (const group of chunkArray(values, batchSize)) {
			if (group.length === 0) continue;
			await db
				.insert(stations)
				.values(group)
				.onConflictDoNothing({ target: [stations.station_id, stations.operator_id] });
			options.onProgress?.(group.length);
		}
	}
	const uniqueStationIds = Array.from(new Set(prepared.map((p) => p.station.station_id)));
	const rows = uniqueStationIds.length ? await db.query.stations.findMany({ where: inArray(stations.station_id, uniqueStationIds) }) : [];
	const pairToId = new Map<string, number>();
	for (const row of rows) {
		const key = row.station_id;
		if (!pairToId.has(key)) pairToId.set(key, row.id);
	}

	const map: StationIdMap = new Map();
	for (const p of prepared) {
		const key = p.station.station_id;
		const id = pairToId.get(key);
		if (typeof id === "number") map.set(p.station.original_id, id);
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
						variant: "commercial" as const,
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
	const prepared = items
		.map((cell) => ({
			cell,
			stationId: stationIds.get(cell.station_original_id) ?? (null as number | null),
			bandId: bandIds.get(bandKeyId({ rat: cell.band_key.rat, value: cell.band_key.value, duplex: cell.band_key.duplex })) ?? (null as number | null),
		}))
		.filter((p) => typeof p.stationId === "number" && typeof p.bandId === "number");

	const values = prepared.map((p) => ({
		station_id: p.stationId as number,
		band_id: p.bandId as number,
		rat: p.cell.rat,
		notes: p.cell.notes ?? undefined,
		is_confirmed: p.cell.is_confirmed,
		createdAt: p.cell.date_added ?? undefined,
		updatedAt: p.cell.date_updated ?? undefined,
	}));

	const batchSize = options.batchSize ?? values.length;
	const inserted: Array<{ id: number }> = [];
	if (values.length) {
		for (const group of chunkArray(values, batchSize)) {
			if (group.length === 0) continue;
			const part = await db.insert(cells).values(group).returning({ id: cells.id });
			inserted.push(...part);
			options.onProgress?.(group.length);
		}
	}

	const idMap: CellIdMap = new Map();
	for (let i = 0; i < prepared.length; i++) {
		const insert = inserted[i];
		const p = prepared[i];
		if (insert && p) idMap.set(p.cell.original_id, insert.id);
	}
	return idMap;
}

export async function writeCellsAndDetails(
	items: PreparedCell[],
	stationIds: StationIdMap,
	bandIds: BandIdMap,
	options: WriteOptions = {},
): Promise<void> {
	const prepared = items
		.map((cell) => ({
			cell,
			stationId: stationIds.get(cell.station_original_id) ?? (null as number | null),
			bandId: bandIds.get(bandKeyId({ rat: cell.band_key.rat, value: cell.band_key.value, duplex: cell.band_key.duplex })) ?? (null as number | null),
		}))
		.filter((p) => typeof p.stationId === "number" && typeof p.bandId === "number");

	const baseValues = prepared.map((p) => ({
		station_id: p.stationId as number,
		band_id: p.bandId as number,
		rat: p.cell.rat,
		notes: p.cell.notes ?? undefined,
		is_confirmed: p.cell.is_confirmed,
		createdAt: p.cell.date_added ?? undefined,
		updatedAt: p.cell.date_updated ?? undefined,
	}));
	const batchSize = options.batchSize ?? baseValues.length;
	options.onBeginPhase?.("base", baseValues.length);
	const inserted: Array<{ id: number }> = [];
	if (baseValues.length) {
		for (const group of chunkArray(baseValues, batchSize)) {
			if (group.length === 0) continue;
			const part = await db.insert(cells).values(group).returning({ id: cells.id });
			inserted.push(...part);
			options.onProgress?.(group.length);
			options.onPhase?.("base", group.length);
		}
	}

	const withIds = prepared.map((prep, i) => ({ id: inserted[i]?.id ?? 0, cell: prep.cell }));

	const gsmValues = withIds
		.filter((val): val is { id: number; cell: Extract<PreparedCell, { rat: "GSM" }> } => val.cell.rat === "GSM" && !!val.id)
		.filter((val) => val.cell.gsm.lac != null && val.cell.gsm.cid != null)
		.map((val) => ({
			cell_id: val.id,
			lac: val.cell.gsm.lac as number,
			cid: val.cell.gsm.cid as number,
			e_gsm: val.cell.gsm.e_gsm,
			createdAt: val.cell.date_added ?? new Date(),
			updatedAt: val.cell.date_updated ?? new Date(),
		}));
	options.onBeginPhase?.("GSM", gsmValues.length);
	if (gsmValues.length) {
		for (const group of chunkArray(gsmValues, options.batchSize ?? gsmValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(gsmCells)
				.values(group)
				.onConflictDoNothing({ target: [gsmCells.lac, gsmCells.cid] });
			options.onProgress?.(group.length);
			options.onPhase?.("GSM", group.length);
		}
	}

	const umtsValues = withIds
		.filter((val): val is { id: number; cell: Extract<PreparedCell, { rat: "UMTS" }> } => val.cell.rat === "UMTS" && !!val.id)
		.map((val) => ({
			cell_id: val.id,
			lac: val.cell.umts.lac,
			rnc: val.cell.umts.rnc,
			cid: val.cell.umts.cid,
			carrier: val.cell.umts.carrier,
			createdAt: val.cell.date_added ?? new Date(),
			updatedAt: val.cell.date_updated ?? new Date(),
		}));
	options.onBeginPhase?.("UMTS", umtsValues.length);
	if (umtsValues.length) {
		for (const group of chunkArray(umtsValues, options.batchSize ?? umtsValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(umtsCells)
				.values(group)
				.onConflictDoNothing({ target: [umtsCells.rnc, umtsCells.cid] });
			options.onProgress?.(group.length);
			options.onPhase?.("UMTS", group.length);
		}
	}

	const lteValues = withIds
		.filter((val): val is { id: number; cell: Extract<PreparedCell, { rat: "LTE" }> } => val.cell.rat === "LTE" && !!val.id)
		.map((val) => ({
			cell_id: val.id,
			tac: val.cell.lte.tac,
			enbid: val.cell.lte.enbid,
			clid: val.cell.lte.clid,
			supports_nb_iot: val.cell.lte.supports_nb_iot,
			createdAt: val.cell.date_added ?? new Date(),
			updatedAt: val.cell.date_updated ?? new Date(),
		}));
	options.onBeginPhase?.("LTE", lteValues.length);
	if (lteValues.length) {
		for (const group of chunkArray(lteValues, options.batchSize ?? lteValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(lteCells)
				.values(group)
				.onConflictDoNothing({ target: [lteCells.enbid, lteCells.clid] });
			options.onProgress?.(group.length);
			options.onPhase?.("LTE", group.length);
		}
	}

	const nrValues = withIds
		.filter((val): val is { id: number; cell: Extract<PreparedCell, { rat: "NR" }> } => val.cell.rat === "NR" && !!val.id)
		.map((val) => ({
			cell_id: val.id,
			nrtac: val.cell.nr.nrtac,
			gnbid: val.cell.nr.gnbid,
			clid: val.cell.nr.clid,
			supports_nr_redcap: val.cell.nr.supports_nr_redcap,
			createdAt: val.cell.date_added ?? new Date(),
			updatedAt: val.cell.date_updated ?? new Date(),
		}));
	options.onBeginPhase?.("NR", nrValues.length);
	if (nrValues.length) {
		for (const group of chunkArray(nrValues, options.batchSize ?? nrValues.length)) {
			if (group.length === 0) continue;
			await db
				.insert(nrCells)
				.values(group)
				.onConflictDoNothing({ target: [nrCells.cell_id] });
			options.onProgress?.(group.length);
			options.onPhase?.("NR", group.length);
		}
	}
}
