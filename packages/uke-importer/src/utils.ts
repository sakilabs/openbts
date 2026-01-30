import { unlinkSync, existsSync, mkdirSync, writeFileSync, rmdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { URL } from "node:url";
import * as XLSX from "xlsx";
import { DOWNLOAD_DIR } from "./config.js";

export function convertDMSToDD(input: string): number | null {
	if (!input || typeof input !== "string") return null;
	const s = input.trim();
	// Supports formats: "18E43'49.2''" or "18E43'49''" or "18E43'49"
	const m = s.match(/^(?<deg>\d{1,3})(?<hemi>[NSEW])(?<min>\d{1,2})'(?<sec>\d{1,2}(?:\.\d+)?)'*"*$/);
	if (!m) return null;

	const { deg, hemi, min, sec } = m.groups as {
		deg: string;
		hemi: "N" | "S" | "E" | "W";
		min: string;
		sec: string;
	};

	const degrees = Number.parseInt(deg, 10);
	const minutes = Number.parseInt(min, 10);
	const seconds = Number.parseFloat(sec);

	if (minutes >= 60 || seconds >= 60) return null;

	let dd = degrees + minutes / 60 + seconds / 3600;
	if (hemi === "S" || hemi === "W") dd = -dd;

	return Number(dd.toFixed(6));
}

export function stripCompanySuffixForName(name: string): string {
	const stripped = name
		.replace(/\bsp\.?\s*z\.?\s*o\.?\s*o\.?\s*\.?/gi, "")
		.replace(/\bs\.?\s*a\.?\s*\.?/gi, "")
		.replace(/\bspółka z ograniczoną odpowiedzialnością\b/gi, "")
		.replace(/\bspolka z ograniczona odpowiedzialnoscia\b/gi, "")
		.replace(/\bsp\.?\s*k\.?\s*\.?/gi, "")
		.replace(/\bsp\.?\s*j\.?\s*\.?/gi, "")
		.replace(/^\s*[.,-]+\s*/g, "")
		.replace(/\s*[.,-]+\s*$/g, "")
		.replace(/\s+[.,-]+\s+/g, " ")
		.replace(/\s{2,}/g, " ")
		.trim();
	return stripped;
}

export function ensureDownloadDir(): void {
	if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });
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

export function readSheetAsJson<T extends object>(filePath: string, sheetIndex = 0): T[] {
	const wb = XLSX.readFile(filePath, { cellDates: false });
	const sheetName = wb.SheetNames[sheetIndex];
	if (!sheetName) return [];
	const sheet = wb.Sheets[sheetName];
	if (!sheet) return [];
	const rows = XLSX.utils.sheet_to_json<T>(sheet, { raw: true, defval: null });
	return rows;
}

export function getSheetNames(filePath: string): string[] {
	const wb = XLSX.readFile(filePath, { cellDates: false });
	return wb.SheetNames;
}

export function chunk<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}

export function parseExcelDate(val: number | string | undefined): Date | null {
	if (val == null || val === "") return null;
	if (typeof val === "number") {
		const epoch = new Date(Date.UTC(1899, 11, 30));
		return new Date(epoch.getTime() + val * 86400000);
	}

	const date = new Date(val);
	return Number.isNaN(date.getTime()) ? null : date;
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
