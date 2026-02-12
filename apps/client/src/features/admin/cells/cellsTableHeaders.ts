import type { TFunction } from "i18next";

export function getTableHeaders(rat: string, t: TFunction, options?: { showConfirmed?: boolean }): string[] {
	const showConfirmed = options?.showConfirmed ?? true;
	switch (rat) {
		case "GSM": {
			const headers = [t("common:labels.band"), "Duplex", "LAC", "CID", "E-GSM", t("common:labels.notes")];
			if (showConfirmed) headers.push(t("common:labels.confirmed"));
			headers.push("");
			return headers;
		}
		case "UMTS": {
			const headers = [t("common:labels.band"), "Duplex", "LAC", "RNC", "CID", "LongCID", t("stations:cells.carrier"), t("common:labels.notes")];
			if (showConfirmed) headers.push(t("common:labels.confirmed"));
			headers.push("");
			return headers;
		}
		case "LTE": {
			const headers = [t("common:labels.band"), "Duplex", "TAC", "eNBID", "CLID", "E-CID", "NB-IoT", t("common:labels.notes")];
			if (showConfirmed) headers.push(t("common:labels.confirmed"));
			headers.push("");
			return headers;
		}
		case "NR": {
			const headers = [t("common:labels.band"), "Duplex", "TAC", "gNBID", "CLID", "NCI", "PCI", "RedCap", t("common:labels.notes")];
			if (showConfirmed) headers.push(t("common:labels.confirmed"));
			headers.push("");
			return headers;
		}
		default:
			return [];
	}
}
