import path from "node:path";
import url from "node:url";

import { radiolinesAntennaTypes, radioLinesManufacturers, radiolinesTransmitterTypes, ukeRadiolines } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, RADIOLINES_URL } from "./config.js";
import { chunk, convertDMSToDD, downloadFile, ensureDownloadDir, parseExcelDate, readSheetAsJson, stripCompanySuffixForName } from "./utils.js";
import { scrapeXlsxLinks } from "./scrape.js";
import { upsertUkeOperators } from "./upserts.js";
import { db } from "@openbts/drizzle/db";
import { isDataUpToDate, recordImportMetadata } from "./import-check.js";

import type { RawRadioLineData } from "./types.js";
function isNonEmptyName<T extends { name: string | undefined }>(v: T): v is T & { name: string } {
	return typeof v.name === "string" && v.name.length > 0;
}

export async function importRadiolines(): Promise<boolean> {
	console.log("[radiolines] Starting radiolines import...");
	console.log("[radiolines] Scraping file links from:", RADIOLINES_URL);
	const links = await scrapeXlsxLinks(RADIOLINES_URL);
	if (!links[0]) {
		console.log("[radiolines] No files found");
		return false;
	}
	console.log(`[radiolines] Found ${links.length} file(s)`);

	if (await isDataUpToDate("radiolines", links)) {
		console.log("[radiolines] Data is up-to-date, skipping import");
		return false;
	}

	ensureDownloadDir();
	const first = links[0];
	const fileName = `${(first.text || path.basename(new url.URL(first.href).pathname)).replace(/\s+/g, "_").replace("_plik_XLSX", "")}.xlsx`;
	const filePath = path.join(DOWNLOAD_DIR, fileName);
	console.log(`[radiolines] Downloading: ${fileName}`);
	await downloadFile(first.href, filePath);
	const rows = readSheetAsJson<RawRadioLineData>(filePath);
	console.log(`[radiolines] Loaded ${rows.length} rows`);

	console.log("[radiolines] Collecting manufacturers, antenna types, transmitter types...");
	const manufNames = new Set<string>();
	const antTypeTuples = new Set<string>();
	const txTypeTuples = new Set<string>();
	for (const r of rows) {
		if (r.Prod_ant_Tx) manufNames.add(String(r.Prod_ant_Tx).trim());
		if (r.Prod_ant_Rx) manufNames.add(String(r.Prod_ant_Rx).trim());
		if (r.Prod_nad) manufNames.add(String(r.Prod_nad).trim());
		if (r.Typ_ant_Tx) antTypeTuples.add(`${String(r.Typ_ant_Tx).trim()}|${String(r.Prod_ant_Tx || "").trim()}`);
		if (r.Typ_ant_Rx) antTypeTuples.add(`${String(r.Typ_ant_Rx).trim()}|${String(r.Prod_ant_Rx || "").trim()}`);
		if (r.Typ_nad) txTypeTuples.add(`${String(r.Typ_nad).trim()}|${String(r.Prod_nad || "").trim()}`);
	}
	console.log(`[radiolines] Found ${manufNames.size} manufacturers, ${antTypeTuples.size} antenna types, ${txTypeTuples.size} transmitter types`);

	console.log("[radiolines] Upserting manufacturers...");
	const manufArr = Array.from(manufNames).filter((s) => s.length > 0);
	if (manufArr.length) {
		for (const group of chunk(manufArr, BATCH_SIZE)) {
			await db
				.insert(radioLinesManufacturers)
				.values(group.map((n) => ({ name: n })))
				.onConflictDoNothing({ target: [radioLinesManufacturers.name] });
		}
	}
	const manufRowsAll = manufArr.length ? await db.query.radioLinesManufacturers.findMany({ where: { name: { in: manufArr } } }) : [];
	const manufIdByName = new Map<string, number>();
	for (const m of manufRowsAll) manufIdByName.set(m.name, m.id);

	console.log("[radiolines] Upserting antenna types...");
	const antTypesRaw = Array.from(antTypeTuples).map((s) => {
		const [name, man] = s.split("|");
		return { name, manufacturer_id: man ? (manufIdByName.get(man) ?? null) : null } as { name: string | undefined; manufacturer_id: number | null };
	});
	const antTypes = antTypesRaw.filter(isNonEmptyName);
	if (antTypes.length) {
		for (const group of chunk(antTypes, BATCH_SIZE)) {
			await db
				.insert(radiolinesAntennaTypes)
				.values(group.map((a) => ({ name: a.name, manufacturer_id: a.manufacturer_id })))
				.onConflictDoNothing({ target: [radiolinesAntennaTypes.name] });
		}
	}
	const antRowsAll = antTypes.length
		? await db.query.radiolinesAntennaTypes.findMany({
				where: { name: { in: antTypes.map((a) => a.name) } },
			})
		: [];
	const antIdByName = new Map<string, number>();
	for (const a of antRowsAll) antIdByName.set(a.name, a.id);

	console.log("[radiolines] Upserting transmitter types...");
	const txTypesRaw = Array.from(txTypeTuples).map((s) => {
		const [name, man] = s.split("|");
		return { name, manufacturer_id: man ? (manufIdByName.get(man) ?? null) : null } as { name: string | undefined; manufacturer_id: number | null };
	});
	const txTypes = txTypesRaw.filter(isNonEmptyName);
	if (txTypes.length) {
		for (const group of chunk(txTypes, BATCH_SIZE)) {
			await db
				.insert(radiolinesTransmitterTypes)
				.values(group.map((t) => ({ name: t.name, manufacturer_id: t.manufacturer_id })))
				.onConflictDoNothing({ target: [radiolinesTransmitterTypes.name] });
		}
	}
	const txRowsAll = txTypes.length
		? await db.query.radiolinesTransmitterTypes.findMany({
				where: { name: { in: txTypes.map((t) => t.name) } },
			})
		: [];
	const txIdByName = new Map<string, number>();
	for (const t of txRowsAll) txIdByName.set(t.name, t.id);

	console.log("[radiolines] Upserting operators...");
	const radioOpNames = Array.from(new Set(rows.map((r) => String(r.Operator || "").trim()).filter((s) => s.length > 0)));
	console.log(`[radiolines] Found ${radioOpNames.length} unique operators`);
	const radioOpsIdByName = await upsertUkeOperators(radioOpNames);

	console.log("[radiolines] Preparing radioline records...");
	const values = rows.map((r) => {
		const tx_lon = convertDMSToDD(r.Dl_geo_Tx) ?? 0;
		const tx_lat = convertDMSToDD(r.Sz_geo_Tx) ?? 0;
		const rx_lon = convertDMSToDD(r.Dl_geo_Rx) ?? 0;
		const rx_lat = convertDMSToDD(r.Sz_geo_Rx) ?? 0;
		const ghzStr = String(r["f [GHz]"] || "");
		const ghz = Number.parseFloat(ghzStr);
		const freq = Math.round((Number.isFinite(ghz) ? ghz : 0) * 1000);

		return {
			tx_longitude: tx_lon,
			tx_latitude: tx_lat,
			tx_height: Number(r["H_t_Tx [m npm]"]) || 0,
			tx_city: String(r["Miejscowość Tx"] || "").trim() || null,
			tx_province: String(r["Województwo Tx"] || "").trim() || null,
			tx_street: String(r["Ulica Tx"] || "").trim() || null,
			tx_location_description: String(r["Opis położenia Tx"] || "").trim() || null,

			rx_longitude: rx_lon,
			rx_latitude: rx_lat,
			rx_height: Number(r["H_t_Rx [m npm]"]) || 0,
			rx_city: String(r["Miejscowość Rx"] || "").trim() || null,
			rx_province: String(r["Województwo Rx"] || "").trim() || null,
			rx_street: String(r["Ulica Rx"] || "").trim() || null,
			rx_location_description: String(r["Opis położenia Rx"] || "").trim() || null,

			freq,
			ch_num: Number(r.Nr_kan) || null,
			plan_symbol: String(r.Symbol_planu || "").trim() || null,
			ch_width: Number(String(r["Szer_kan [MHz]"] || "")) || null,
			polarization: String(r.Polaryzacja || "").trim() || null,
			modulation_type: String(r["Rodz_modu-lacji"] || "").trim() || null,
			bandwidth: r["Przepływność [Mb/s]"] == null ? null : String(r["Przepływność [Mb/s]"]),

			tx_eirp: Number(String(r["EIRP [dBm]"] || "")) || null,
			tx_antenna_attenuation: Number(String(r["Tłum_ant_odb_Rx [dB]"] || "")) || null,
			tx_transmitter_type_id: txIdByName.get(String(r.Typ_nad || "").trim()) ?? null,
			tx_antenna_type_id: antIdByName.get(String(r.Typ_ant_Tx || "").trim()) ?? null,
			tx_antenna_gain: Number(String(r["Zysk_ant_Tx [dBi]"] || "")) || null,
			tx_antenna_height: Number(r["H_ant_Tx [m npt]"]) || null,

			rx_antenna_type_id: antIdByName.get(String(r.Typ_ant_Rx || "").trim()) ?? null,
			rx_antenna_gain: Number(String(r["Zysk_ant_Rx [dBi]"] || "")) || null,
			rx_antenna_height: Number(r["H_ant_Rx [m npt]"]) || null,
			rx_noise_figure: Number(String(r["Liczba_szum_Rx [dB]"] || "")) || null,
			rx_atpc_attenuation: Number(String(r["Tłum_ATPC [dB]"] || "")) || null,

			operator_id: radioOpsIdByName.get(stripCompanySuffixForName(String(r.Operator || "").trim())) ?? null,
			permit_number: String(r["Nr_pozw/dec"] || "").trim(),
			decision_type: (r.Rodz_dec === "zmP" ? "zmP" : "P") as "zmP" | "P",
			issue_date: parseExcelDate(r.Data_wydania),
			expiry_date: parseExcelDate(r["Data_ważn_pozw/dec"]) ?? new Date(),
		};
	});

	console.log(`[radiolines] Inserting ${values.length} radiolines...`);
	for (const group of chunk(values, BATCH_SIZE)) {
		if (group.length) await db.insert(ukeRadiolines).values(group);
	}

	await recordImportMetadata("radiolines", links, "success");
	console.log("[radiolines] Import completed successfully");
	return true;
}
