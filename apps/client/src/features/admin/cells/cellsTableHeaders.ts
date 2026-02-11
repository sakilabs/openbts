import type { TFunction } from "i18next";

export function getTableHeaders(rat: string, t: TFunction, options?: { showConfirmed?: boolean }): string[] {
	const showConfirmed = options?.showConfirmed ?? true;
	switch (rat) {
		case "GSM": {
			const headers = [t("cells.band"), t("cells.duplex"), "LAC", "CID", "E-GSM", t("cells.notes")];
			if (showConfirmed) headers.push(t("cells.confirmed"));
			headers.push("");
			return headers;
		}
		case "UMTS": {
			const headers = [t("cells.band"), t("cells.duplex"), "LAC", "RNC", "CID", "LongCID", t("cellFields.carrier"), t("cells.notes")];
			if (showConfirmed) headers.push(t("cells.confirmed"));
			headers.push("");
			return headers;
		}
		case "LTE": {
			const headers = [t("cells.band"), t("cells.duplex"), "TAC", "eNBID", "CLID", "E-CID", "NB-IoT", t("cells.notes")];
			if (showConfirmed) headers.push(t("cells.confirmed"));
			headers.push("");
			return headers;
		}
		case "NR": {
			const headers = [t("cells.band"), t("cells.duplex"), "TAC", "gNBID", "CLID", "NCI", "PCI", "RedCap", t("cells.notes")];
			if (showConfirmed) headers.push(t("cells.confirmed"));
			headers.push("");
			return headers;
		}
		default:
			return [];
	}
}
