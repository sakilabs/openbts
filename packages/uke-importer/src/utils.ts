import { unlinkSync, existsSync, mkdirSync, writeFileSync, rmdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { URL } from "node:url";
import * as XLSX from "xlsx";
import { DOWNLOAD_DIR } from "./config.js";

export function convertDMSToDD(input: string): number {
	const s = input.trim();
	const m = s.match(/^(?<deg>\d{1,3})(?<hemi>[NSEW])(?<min>\d{2})'(?<sec>\d{2})"$/);
	if (!m) throw new Error("Invalid format. Expected <deg><N|S|E|W><mm>'<ss>\"");

	const { deg, hemi, min, sec } = m.groups as {
		deg: string;
		hemi: "N" | "S" | "E" | "W";
		min: string;
		sec: string;
	};

	const degrees = Number.parseInt(deg, 10);
	const minutes = Number.parseInt(min, 10);
	const seconds = Number.parseInt(sec, 10);

	if (minutes >= 60 || seconds >= 60) throw new Error("Minutes and seconds must be in [0,59]");

	let dd = degrees + minutes / 60 + seconds / 3600;
	if (hemi === "S" || hemi === "W") dd = -dd;

	return Number(dd.toFixed(6));
}

export function stripCompanySuffixForName(name: string): string {
	const lowered = name
		.replace(/\bsp\.?\s*z\.?\s*o\.?\s*o\.?\b/gi, "")
		.replace(/\bs\.?a\.?\b/gi, "")
		.replace(/\bspółka z ograniczoną odpowiedzialnością\b/gi, "")
		.replace(/\bspolka z ograniczona odpowiedzialnoscia\b/gi, "")
		.replace(/\bsp\.?\s*k\.?\b/gi, "")
		.replace(/\bsa\b/gi, "")
		.replace(/\s{2,}/g, " ")
		.trim();
	return lowered;
}

export function ensureDownloadDir(): void {
	if (!existsSync(DOWNLOAD_DIR)) {
		mkdirSync(DOWNLOAD_DIR, { recursive: true });
	}
}

export async function downloadFile(fileUrl: string, outPath: string): Promise<void> {
	const res = await fetch(fileUrl);
	const ab = await res.arrayBuffer();
	writeFileSync(outPath, Buffer.from(ab));
}

export function absolutize(base: string, href: string): string {
	try {
		return new URL(href, base).toString();
	} catch {
		return href;
	}
}

export function readSheetAsJson<T extends object>(filePath: string): T[] {
	const wb = XLSX.readFile(filePath, { cellDates: false });
	const sheetName = wb.SheetNames[0];
	if (!sheetName) return [];
	const sheet = wb.Sheets[sheetName];
	if (!sheet) return [];
	const rows = XLSX.utils.sheet_to_json<T>(sheet, { raw: true, defval: null });
	return rows;
}

export function chunk<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}

export async function cleanupDownloads(): Promise<void> {
	if (!existsSync(DOWNLOAD_DIR)) return;
	for (const file of readdirSync(DOWNLOAD_DIR)) {
		const p = join(DOWNLOAD_DIR, file);
		try {
			unlinkSync(p);
		} catch {}
	}
	try {
		rmdirSync(DOWNLOAD_DIR);
	} catch {}
}
