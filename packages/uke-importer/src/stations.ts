import path from "node:path";
import url from "node:url";
import { ukePermits, type ratEnum } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, REGION_BY_TERYT_PREFIX, STATIONS_URL } from "./config.js";
import { chunk, convertDMSToDD, downloadFile, ensureDownloadDir, readSheetAsJson, stripCompanySuffixForName } from "./utils.js";
import { scrapeXlsxLinks } from "./scrape.js";
import { upsertBands, upsertOperators, upsertRegions, upsertUkeLocations } from "./upserts.js";
import type { RawUkeData } from "./types.js";
import { db } from "@openbts/drizzle/db";

function parseBandFromLabel(label: string): { rat: (typeof ratEnum.enumValues)[number]; value: number } | null {
	const firstToken = (label.trim().toLowerCase().split(/\s|-/)[0] ?? "").trim();
	if (!firstToken) return null;
	const m = firstToken.match(/^(gsm|umts|lte|5g)(\d{3,4})$/i);
	if (!m) return null;
	const tech = m[1]?.toLowerCase() ?? "";
	const bandStr = m[2] ?? "";
	const value = Number(bandStr);
	if (!Number.isFinite(value)) return null;
	const rat = tech === "gsm" ? ("GSM" as const) : tech === "umts" ? ("UMTS" as const) : tech === "lte" ? ("LTE" as const) : ("NR" as const);
	return { rat, value };
}

async function insertUkePermits(
	raws: RawUkeData[],
	bandMap: Map<string, number>,
	operatorIdByName: Map<string, number>,
	locationIdByLonLat: Map<string, number>,
	labelToBandKey: (label: string) => { rat: (typeof ratEnum.enumValues)[number]; value: number } | null,
	fileLabel: string,
): Promise<void> {
	const bandKey = labelToBandKey(fileLabel);
	if (!bandKey) return;
	const bandId = bandMap.get(`${bandKey.rat}:${bandKey.value}`);
	if (!bandId) return;
	const values = raws
		.map((r) => {
			const lon = convertDMSToDD(r["Dł geogr stacji"]) ?? null;
			const lat = convertDMSToDD(r["Szer geogr stacji"]) ?? null;
			if (!lon || !lat) return null;
			const permitDate = new Date(r["Data ważności"]) ?? new Date();
			const opName = stripCompanySuffixForName(String(r["Nazwa Operatora"] || "").trim());
			const operator_id = operatorIdByName.get(opName) ?? null;
			if (!operator_id) return null;
			const locationKey = `${lon}:${lat}`;
			const location_id = locationIdByLonLat.get(locationKey) ?? null;
			if (!location_id) return null;
			return {
				station_id: String(r.IdStacji || "").trim(),
				operator_id,
				location_id,
				decision_number: String(r["Nr Decyzji"] || "").trim(),
				decision_type: (r["Rodzaj decyzji"] ?? "P") as "zmP" | "P",
				expiry_date: permitDate,
				band_id: bandId,
			};
		})
		.filter((v): v is NonNullable<typeof v> => v != null);
	for (const group of chunk(values, BATCH_SIZE)) {
		if (group.length) await db.insert(ukePermits).values(group);
	}
}

export async function importStations(): Promise<void> {
	const links = await scrapeXlsxLinks(STATIONS_URL);
	const filtered = links.filter((l) => {
		const token = (l.text || l.href).toLowerCase();
		return !token.startsWith("gsm-r");
	});
	if (!filtered.length) return;
	ensureDownloadDir();
	const bandKeys: Array<{ rat: (typeof ratEnum.enumValues)[number]; value: number }> = [];
	for (const l of filtered) {
		const parsed = parseBandFromLabel(l.text || l.href);
		if (parsed) bandKeys.push(parsed);
	}
	const bandMap = await upsertBands(bandKeys);
	const regionItems = Object.values(REGION_BY_TERYT_PREFIX);
	const regionIds = await upsertRegions(regionItems);

	const operatorNamesSet = new Set<string>();
	const locationItems: Array<{ regionName: string; city: string | null; address: string | null; lon: number; lat: number }> = [];
	const fileRows: Array<{ label: string; rows: RawUkeData[] }> = [];

	for (const l of filtered) {
		const fileName = `${(l.text || path.basename(new url.URL(l.href).pathname)).replace(/\s+/g, "_")}`;
		const filePath = path.join(DOWNLOAD_DIR, fileName);
		await downloadFile(l.href, filePath);
		const rows = readSheetAsJson<RawUkeData>(filePath);
		fileRows.push({ label: l.text, rows });
		for (const r of rows) {
			const fullOp = String(r["Nazwa Operatora"] || "").trim();
			if (fullOp) operatorNamesSet.add(fullOp);
			const teryt = String(r.TERYT || "");
			const prefix = teryt.slice(0, 2);
			const region = REGION_BY_TERYT_PREFIX[prefix];
			const lon = convertDMSToDD(r["Dł geogr stacji"]);
			const lat = convertDMSToDD(r["Szer geogr stacji"]);
			if (region && lon != null && lat != null)
				locationItems.push({ regionName: region.name, city: r.Miejscowość || null, address: r.Lokalizacja || null, lon, lat });
		}
	}
	const operatorIdByName = await upsertOperators(Array.from(operatorNamesSet));
	const locationIdByLonLat = await upsertUkeLocations(locationItems, regionIds);

	for (const fr of fileRows) {
		await insertUkePermits(fr.rows, bandMap, operatorIdByName, locationIdByLonLat, parseBandFromLabel, fr.label);
	}
}
