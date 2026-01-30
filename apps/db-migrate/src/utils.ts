export function toInt(val: string | number | null | undefined): number | null {
	if (val === null) return null;
	if (typeof val === "number") return Number.isNaN(val) ? null : val;
	const num = Number(String(val).trim());
	return Number.isNaN(num) ? null : num;
}

export function convertDMSToDD(input: string): number {
	const s = input.trim();
	const m = s.match(/^(\d{1,3})([NSEW])(\d{2})'(\d{2})"$/);
	if (!m) {
		throw new Error("Invalid format. Expected <deg><N|S|E|W><mm>'<ss>\"");
	}

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

	return dd;
}

export type Rat = "GSM" | "CDMA" | "UMTS" | "LTE" | "NR" | "IOT";
export function mapStandardToRat(std: string): Rat | null {
	switch (std.toUpperCase()) {
		case "GSM":
			return "GSM";
		case "UMTS":
			return "UMTS";
		case "CDMA":
			return "CDMA";
		case "LTE":
			return "LTE";
		case "5G":
		case "NR":
			return "NR";
		case "IOT":
			return "IOT";
		default:
			return null;
	}
}

export function mapDuplex(val: string | null | undefined): "FDD" | "TDD" | null {
	if (!val) return null;
	const duplex = val.toUpperCase();
	if (duplex === "FDD" || duplex === "TDD") return duplex;
	return null;
}

export function stripNotes(note: string, regexes: RegExp[]): string | null {
	const removed = regexes.reduce((acc, regex) => acc.replace(regex, ""), note);
	const tight = removed.replace(/\s{2,}/g, " ");
	const compactDelims = tight.replace(/\s*([,;|/-])\s*/g, "$1");
	const trimmedDelims = compactDelims.replace(/^([,;|/-])+|([,;|/-])+$/g, "");
	const out = trimmedDelims.trim();
	return out.length ? out : null;
}
