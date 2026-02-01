import { inArray } from "drizzle-orm";
import { bands, regions, ukeLocations, operators, ukeOperators, type ratEnum } from "@openbts/drizzle";
import { db } from "@openbts/drizzle/db";
import { BATCH_SIZE } from "./config.js";
import { chunk, stripCompanySuffixForName } from "./utils.js";

const UKE_OPERATOR_NAME_MAP: Record<string, string> = {
	p4: "Play",
	"orange polska": "Orange",
	"t-mobile polska": "T-Mobile",
	polkomtel: "Plus",
};

export async function upsertRegions(items: Array<{ name: string; code: string }>): Promise<Map<string, number>> {
	const unique = Array.from(new Map(items.filter((i) => i.name && i.code).map((i) => [i.name, i])).values());

	if (unique.length) {
		const existing = await db.query.regions.findMany({
			where: inArray(
				regions.name,
				unique.map((r) => r.name),
			),
		});

		const existingNames = new Set(existing.map((r) => r.name));
		const toInsert = unique.filter((r) => !existingNames.has(r.name));

		if (toInsert.length) {
			await db.insert(regions).values(toInsert.map((region) => ({ name: region.name, code: region.code })));
		}

		const allRows = await db.query.regions.findMany({
			where: inArray(
				regions.name,
				unique.map((region) => region.name),
			),
		});

		const map = new Map<string, number>();
		for (const r of allRows) map.set(r.name, r.id);
		return map;
	}

	return new Map<string, number>();
}

export async function upsertBands(keys: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }>): Promise<Map<string, number>> {
	const unique: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }> = [];
	const seen = new Set<string>();
	for (const k of keys) {
		if (k.rat === "NR" && k.value === 3600) k.value = 3500;
		const id = `${k.rat}:${k.value}`;
		if (seen.has(id)) continue;
		seen.add(id);
		unique.push(k);
	}

	if (unique.length) {
		const existing = await db.query.bands.findMany({
			where: inArray(
				bands.value,
				unique.map((k) => k.value),
			),
		});

		const existingKeys = new Set(existing.map((b) => `${b.rat}:${b.value}:${b.duplex}`));
		const toInsert = unique.filter((k) => !existingKeys.has(`${k.rat}:${k.value}:null`));

		if (toInsert.length) {
			await db.insert(bands).values(
				toInsert.map((band) => ({
					rat: band.rat,
					value: band.value,
					duplex: null,
					name: `${band.rat} ${band.value}`,
				})),
			);
		}

		const allRows = await db.query.bands.findMany({
			where: inArray(
				bands.value,
				unique.map((k) => k.value),
			),
		});

		const map = new Map<string, number>();
		for (const r of allRows) map.set(`${r.rat}:${r.value}`, r.id);
		return map;
	}

	return new Map<string, number>();
}

export async function getOperators(rawNames: string[]): Promise<Map<string, number>> {
	const prepared = rawNames
		.map((full) => {
			const strippedName = stripCompanySuffixForName(full);
			const mappedName = UKE_OPERATOR_NAME_MAP[strippedName.toLowerCase()] ?? strippedName;
			return { originalName: strippedName, mappedName };
		})
		.filter((o) => o.mappedName.length > 0);

	const uniqueMappedNames = [...new Set(prepared.map((p) => p.mappedName))];

	const existingOperators = uniqueMappedNames.length
		? await db.query.operators.findMany({
				where: inArray(operators.name, uniqueMappedNames),
			})
		: [];

	const operatorIdByName = new Map<string, number>();
	for (const op of existingOperators) {
		operatorIdByName.set(op.name, op.id);
	}

	const map = new Map<string, number>();
	for (const p of prepared) {
		const operatorId = operatorIdByName.get(p.mappedName);
		if (operatorId != null) {
			map.set(p.originalName, operatorId);
		}
	}

	return map;
}

export async function upsertUkeOperators(rawNames: string[]): Promise<Map<string, number>> {
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
		const existing = await db.query.ukeOperators.findMany({
			where: inArray(
				ukeOperators.full_name,
				values.map((v) => v.full_name),
			),
		});

		const existingFullNames = new Set(existing.map((o) => o.full_name));
		const toInsert = values.filter((v) => !existingFullNames.has(v.full_name));

		if (toInsert.length) {
			await db.insert(ukeOperators).values(toInsert.map((op) => ({ name: op.name, full_name: op.full_name })));
		}

		const allRows = await db.query.ukeOperators.findMany({
			where: inArray(
				ukeOperators.name,
				values.map((v) => v.name),
			),
		});

		const map = new Map<string, number>();
		for (const r of allRows) map.set(r.name, r.id);
		return map;
	}

	return new Map<string, number>();
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
		const latLong = uniq.map((l) => ({ lat: l.lat, lon: l.lon }));
		const existing = await db.query.ukeLocations.findMany({
			where: (fields, { and }) =>
				and(
					inArray(
						fields.longitude,
						latLong.map((l) => l.lon),
					),
					inArray(
						fields.latitude,
						latLong.map((l) => l.lat),
					),
				),
		});

		const existingCoords = new Set(existing.map((l) => `${l.longitude}:${l.latitude}`));
		const toInsert = uniq.filter((it) => !existingCoords.has(`${it.lon}:${it.lat}`));

		if (toInsert.length) {
			for (const group of chunk(toInsert, BATCH_SIZE)) {
				await db.insert(ukeLocations).values(
					group.map((loc) => ({
						region_id: regionIds.get(loc.regionName) ?? 0,
						city: loc.city ?? undefined,
						address: loc.address ?? undefined,
						longitude: loc.lon,
						latitude: loc.lat,
					})),
				);
			}
		}

		const allRows = await db.query.ukeLocations.findMany({
			where: (fields, { and }) =>
				and(
					inArray(
						fields.longitude,
						latLong.map((l) => l.lon),
					),
					inArray(
						fields.latitude,
						latLong.map((l) => l.lat),
					),
				),
		});

		const map = new Map<string, number>();
		for (const r of allRows) map.set(`${r.longitude}:${r.latitude}`, r.id);
		return map;
	}

	return new Map<string, number>();
}
