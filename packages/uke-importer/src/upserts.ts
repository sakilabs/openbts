import { inArray } from "drizzle-orm";
import { bands, operators, regions, ukeLocations, type ratEnum } from "@openbts/drizzle";
import { db } from "@openbts/drizzle/db";
import { BATCH_SIZE } from "./config.js";
import { chunk, stripCompanySuffixForName } from "./utils.js";

export async function upsertRegions(items: Array<{ name: string; code: string }>): Promise<Map<string, number>> {
	const unique = Array.from(new Map(items.filter((i) => i.name && i.code).map((i) => [i.name, i])).values());
	if (unique.length) {
		await db
			.insert(regions)
			.values(unique.map((i) => ({ name: i.name, code: i.code })))
			.onConflictDoNothing({ target: [regions.name] });
	}
	const rows = unique.length
		? await db.query.regions.findMany({
				where: inArray(
					regions.name,
					unique.map((i) => i.name),
				),
			})
		: [];
	const map = new Map<string, number>();
	for (const r of rows) map.set(r.name, r.id);
	return map;
}

export async function upsertBands(keys: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }>): Promise<Map<string, number>> {
	const unique: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }> = [];
	const seen = new Set<string>();
	for (const k of keys) {
		const id = `${k.rat}:${k.value}`;
		if (seen.has(id)) continue;
		seen.add(id);
		unique.push(k);
	}
	if (unique.length) {
		await db
			.insert(bands)
			.values(unique.map((k) => ({ rat: k.rat, value: k.value, duplex: null, name: `${k.rat} ${k.value}` })))
			.onConflictDoNothing({ target: [bands.rat, bands.value] });
	}
	const rows = unique.length
		? await db.query.bands.findMany({
				where: inArray(
					bands.value,
					unique.map((k) => k.value),
				),
			})
		: [];
	const map = new Map<string, number>();
	for (const r of rows) map.set(`${r.rat}:${r.value}`, r.id);
	return map;
}

export async function upsertOperators(rawNames: string[]): Promise<Map<string, number>> {
	const prepared = rawNames
		.map((full) => {
			const name = stripCompanySuffixForName(full);
			return { name, full_name: full.trim() };
		})
		.filter((o) => o.name.length > 0);
	const uniqueByName = new Map<string, { name: string; full_name: string }>();
	for (const o of prepared) {
		if (!uniqueByName.has(o.name)) uniqueByName.set(o.name, o);
	}
	const values = Array.from(uniqueByName.values());
	if (values.length) {
		await db
			.insert(operators)
			.values(values.map((v) => ({ name: v.name, full_name: v.full_name, mnc: null, is_isp: false })))
			.onConflictDoNothing({ target: [operators.name] });
	}
	const rows = values.length
		? await db.query.operators.findMany({
				where: inArray(
					operators.name,
					values.map((v) => v.name),
				),
			})
		: [];
	const map = new Map<string, number>();
	for (const r of rows) map.set(r.name, r.id);
	return map;
}

export async function upsertUkeLocations(
	items: Array<{ regionName: string; city: string | null; address: string | null; lon: number; lat: number }>,
	regionIds: Map<string, number>,
): Promise<Map<string, number>> {
	const uniq: typeof items = [];
	const seen = new Set<string>();
	for (const it of items) {
		const id = `${it.lon}:${it.lat}`;
		if (seen.has(id)) continue;
		seen.add(id);
		uniq.push(it);
	}
	if (uniq.length) {
		for (const group of chunk(uniq, BATCH_SIZE)) {
			await db
				.insert(ukeLocations)
				.values(
					group.map((l) => ({
						region_id: regionIds.get(l.regionName) ?? 0,
						city: l.city ?? undefined,
						address: l.address ?? undefined,
						longitude: l.lon,
						latitude: l.lat,
					})),
				)
				.onConflictDoNothing({ target: [ukeLocations.longitude] });
		}
	}

	const map = new Map<string, number>();
	const longs = uniq.map((l) => l.lon);
	const rows = longs.length ? await db.query.ukeLocations.findMany({ where: inArray(ukeLocations.longitude, longs) }) : [];
	for (const r of rows) map.set(`${r.longitude}:${r.latitude}`, r.id);
	return map;
}
