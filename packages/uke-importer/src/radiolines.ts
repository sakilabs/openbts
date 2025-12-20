import path from "node:path";
import url from "node:url";
import { inArray } from "drizzle-orm";

import { radioLinesAntennaTypes, radioLinesManufacturers, radioLinesTransmitterTypes, ukeRadioLines } from "@openbts/drizzle";
import { BATCH_SIZE, DOWNLOAD_DIR, RADIOLINES_URL } from "./config.js";
import { chunk, convertDMSToDD, downloadFile, ensureDownloadDir, readSheetAsJson, stripCompanySuffixForName } from "./utils.js";
import { scrapeXlsxLinks } from "./scrape.js";
import { upsertOperators } from "./upserts.js";
import { db } from "@openbts/drizzle/db";
import { isDataUpToDate, recordImportMetadata } from "./import-check.js";

import type { RawRadioLineData } from "./types.js";
function isNonEmptyName<T extends { name: string | undefined }>(v: T): v is T & { name: string } {
	return typeof v.name === "string" && v.name.length > 0;
}

export async function importRadiolines(): Promise<boolean> {
	const links = await scrapeXlsxLinks(RADIOLINES_URL);
	if (!links[0]) return false;

	if (await isDataUpToDate("radiolines", links)) return false;

	ensureDownloadDir();
	const first = links[0];
	const fileName = `${(first.text || path.basename(new url.URL(first.href).pathname)).replace(/\s+/g, "_")}`;
	const filePath = path.join(DOWNLOAD_DIR, fileName);
	await downloadFile(first.href, filePath);
	const rows = readSheetAsJson<RawRadioLineData>(filePath);

	const manufNames = new Set<string>();
	const antTypeTuples = new Set<string>();
	const txTypeTuples = new Set<string>();
	for (const r of rows) {
		if (r["Prod ant Tx"]) manufNames.add(String(r["Prod ant Tx"]).trim());
		if (r["Prod ant Rx"]) manufNames.add(String(r["Prod ant Rx"]).trim());
		if (r["Prod nad"]) manufNames.add(String(r["Prod nad"]).trim());
		if (r["Typ ant Tx"]) antTypeTuples.add(`${String(r["Typ ant Tx"]).trim()}|${String(r["Prod ant Tx"] || "").trim()}`);
		if (r["Typ ant Rx"]) antTypeTuples.add(`${String(r["Typ ant Rx"]).trim()}|${String(r["Prod ant Rx"] || "").trim()}`);
		if (r["Typ nad"]) txTypeTuples.add(`${String(r["Typ nad"]).trim()}|${String(r["Prod nad"] || "").trim()}`);
	}
	const manufArr = Array.from(manufNames).filter((s) => s.length > 0);
	if (manufArr.length) {
		for (const group of chunk(manufArr, BATCH_SIZE)) {
			await db
				.insert(radioLinesManufacturers)
				.values(group.map((n) => ({ name: n })))
				.onConflictDoNothing({ target: [radioLinesManufacturers.name] });
		}
	}
	const manufRowsAll = manufArr.length
		? await db.query.radioLinesManufacturers.findMany({ where: inArray(radioLinesManufacturers.name, manufArr) })
		: [];
	const manufIdByName = new Map<string, number>();
	for (const m of manufRowsAll) manufIdByName.set(m.name, m.id);

	const antTypesRaw = Array.from(antTypeTuples).map((s) => {
		const [name, man] = s.split("|");
		return { name, manufacturer_id: man ? (manufIdByName.get(man) ?? null) : null } as { name: string | undefined; manufacturer_id: number | null };
	});
	const antTypes = antTypesRaw.filter(isNonEmptyName);
	if (antTypes.length) {
		for (const group of chunk(antTypes, BATCH_SIZE)) {
			await db
				.insert(radioLinesAntennaTypes)
				.values(group.map((a) => ({ name: a.name, manufacturer_id: a.manufacturer_id })))
				.onConflictDoNothing({ target: [radioLinesAntennaTypes.name] });
		}
	}
	const antRowsAll = antTypes.length
		? await db.query.radioLinesAntennaTypes.findMany({
				where: inArray(
					radioLinesAntennaTypes.name,
					antTypes.map((a) => a.name),
				),
			})
		: [];
	const antIdByName = new Map<string, number>();
	for (const a of antRowsAll) antIdByName.set(a.name, a.id);

	const txTypesRaw = Array.from(txTypeTuples).map((s) => {
		const [name, man] = s.split("|");
		return { name, manufacturer_id: man ? (manufIdByName.get(man) ?? null) : null } as { name: string | undefined; manufacturer_id: number | null };
	});
	const txTypes = txTypesRaw.filter(isNonEmptyName);
	if (txTypes.length) {
		for (const group of chunk(txTypes, BATCH_SIZE)) {
			await db
				.insert(radioLinesTransmitterTypes)
				.values(group.map((t) => ({ name: t.name, manufacturer_id: t.manufacturer_id })))
				.onConflictDoNothing({ target: [radioLinesTransmitterTypes.name] });
		}
	}
	const txRowsAll = txTypes.length
		? await db.query.radioLinesTransmitterTypes.findMany({
				where: inArray(
					radioLinesTransmitterTypes.name,
					txTypes.map((t) => t.name),
				),
			})
		: [];
	const txIdByName = new Map<string, number>();
	for (const t of txRowsAll) txIdByName.set(t.name, t.id);

	const radioOpNames = Array.from(new Set(rows.map((r) => String(r.Operator || "").trim()).filter((s) => s.length > 0)));
	const radioOpsIdByName = await upsertOperators(radioOpNames);

	const values = rows.map((r) => {
		const tx_lon = convertDMSToDD(r["Dł geo Tx"]) ?? 0;
		const tx_lat = convertDMSToDD(r["Sz geo Tx"]) ?? 0;
		const rx_lon = convertDMSToDD(r["Dł geo Rx"]) ?? 0;
		const rx_lat = convertDMSToDD(r["Sz geo Rx"]) ?? 0;
		const ghz = typeof r["F [GHz]"] === "number" ? (r["F [GHz]"] as number) : Number(String(r["F [GHz]"]).replace(",", "."));
		const freq = Math.round((Number.isFinite(ghz) ? (ghz as number) : 0) * 1000);
		return {
			tx_longitude: tx_lon,
			tx_latitude: tx_lat,
			tx_height: Number(r["H t Tx [m npm]"]) || 0,
			rx_longitude: rx_lon,
			rx_latitude: rx_lat,
			rx_height: Number(r["H t Rx [m npm]"]) || 0,
			freq,
			ch_num: Number(r["Nr kan"]) || null,
			plan_symbol: String(r["Symbol planu"] || "") || null,
			ch_width: Number(r["Szer kan [MHz]"]) || null,
			polarization: String(r.Polaryzacja || "") || null,
			modulation_type: String(r["Rodz modulacji"] || "") || null,
			bandwidth: r["Przepływność [Mb/s]"] == null ? null : String(r["Przepływność [Mb/s]"]),
			tx_eirp: Number(r["EIRP [dBm]"]) || null,
			tx_antenna_attenuation: Number(r["Tłum ant odb Rx [dB]"]) || null,
			tx_transmitter_type_id: txIdByName.get(String(r["Typ nad"] || "")) ?? null,
			tx_antenna_type_id: antIdByName.get(String(r["Typ ant Tx"] || "")) ?? null,
			tx_antenna_gain: Number(r["Zysk ant Tx [dBi]"]) || null,
			tx_antenna_height: Number(r["H ant Tx [m npt]"]) || null,
			rx_antenna_type_id: antIdByName.get(String(r["Typ ant Rx"] || "")) ?? null,
			rx_antenna_gain: Number(r["Zysk ant Rx [dBi]"]) || null,
			rx_antenna_height: Number(r["H ant Rx [m npt]"]) || null,
			rx_noise_figure: Number(r["Liczba szum Rx [dB]"]) || null,
			rx_atpc_attenuation: Number(r["Tłum ATPC [dB]"]) || null,
			operator_id: radioOpsIdByName.get(stripCompanySuffixForName(String(r.Operator || "").trim())) ?? null,
			permit_number: String(r["Nr pozw/dec"] || "").trim(),
			decision_type: (r["Rodz dec"] ?? "P") as "zmP" | "P",
			expiry_date: new Date(r["Data ważn pozw/dec"]) ?? new Date(),
		};
	});
	for (const group of chunk(values, BATCH_SIZE)) {
		if (group.length) await db.insert(ukeRadioLines).values(group);
	}

	await recordImportMetadata("radiolines", links, "success");
	return true;
}
