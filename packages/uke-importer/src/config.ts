import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL as string;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

export const DOWNLOAD_DIR = path.join(process.cwd(), "apps", "uke-importer", "downloads");

export const STATIONS_URL = "https://bip.uke.gov.pl/pozwolenia-radiowe/wykaz-pozwolen-radiowych-tresci/stacje-gsm-umts-lte-5gnr-oraz-cdma,12,0.html";
export const RADIOLINES_URL = "https://bip.uke.gov.pl/pozwolenia-radiowe/wykaz-pozwolen-radiowych-tresci/linie-radiowe,7.html";

export const BATCH_SIZE = 50;

export const REGION_BY_TERYT_PREFIX: Record<string, { name: string; code: string }> = {
	"02": { name: "Dolnośląskie", code: "DLN" },
	"04": { name: "Kujawsko-pomorskie", code: "KPM" },
	"06": { name: "Lubelskie", code: "LUB" },
	"08": { name: "Lubuskie", code: "LBS" },
	"10": { name: "Łódzkie", code: "LDZ" },
	"12": { name: "Małopolskie", code: "MLP" },
	"14": { name: "Mazowieckie", code: "MAZ" },
	"16": { name: "Opolskie", code: "OPO" },
	"18": { name: "Podkarpackie", code: "PDK" },
	"20": { name: "Podlaskie", code: "POD" },
	"22": { name: "Pomorskie", code: "POM" },
	"24": { name: "Śląskie", code: "SLK" },
	"26": { name: "Świętokrzyskie", code: "SWK" },
	"28": { name: "Warmińsko-mazurskie", code: "WRM" },
	"30": { name: "Wielkopolskie", code: "WKP" },
	"32": { name: "Zachodniopomorskie", code: "ZPM" },
};
