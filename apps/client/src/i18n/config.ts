import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enUSCommon from "./locales/en-US/common.json";
import enUSStations from "./locales/en-US/stations.json";
import enUSNav from "./locales/en-US/nav.json";
import enUSMap from "./locales/en-US/map.json";
import enUSStationDetails from "./locales/en-US/stationDetails.json";
import enUSSubmissions from "./locales/en-US/submissions.json";
import enUSClfExport from "./locales/en-US/clfExport.json";

import plPLCommon from "./locales/pl-PL/common.json";
import plPLStations from "./locales/pl-PL/stations.json";
import plPLNav from "./locales/pl-PL/nav.json";
import plPLMap from "./locales/pl-PL/map.json";
import plPLStationDetails from "./locales/pl-PL/stationDetails.json";
import plPLSubmissions from "./locales/pl-PL/submissions.json";
import plPLClfExport from "./locales/pl-PL/clfExport.json";

export const defaultNS = "common";
export const resources = {
	"en-US": {
		common: enUSCommon,
		stations: enUSStations,
		nav: enUSNav,
		map: enUSMap,
		stationDetails: enUSStationDetails,
		submissions: enUSSubmissions,
		clfExport: enUSClfExport,
	},
	"pl-PL": {
		common: plPLCommon,
		stations: plPLStations,
		nav: plPLNav,
		map: plPLMap,
		stationDetails: plPLStationDetails,
		submissions: plPLSubmissions,
		clfExport: plPLClfExport,
	},
} as const;

export const supportedLanguages = [
	{ code: "en-US", name: "English", nativeName: "English" },
	{ code: "pl-PL", name: "Polish", nativeName: "Polski" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

function getDefaultLanguage(): SupportedLanguage {
	if (typeof window === "undefined") return "pl-PL";

	const stored = localStorage.getItem("i18nextLng");
	if (stored && (stored === "en-US" || stored === "pl-PL")) return stored;

	const browserLang = navigator.language;
	if (browserLang.startsWith("pl")) return "pl-PL";
	if (browserLang.startsWith("en")) return "en-US";

	return "pl-PL";
}

i18n.use(initReactI18next).init({
	resources,
	lng: getDefaultLanguage(),
	fallbackLng: "en-US",
	defaultNS,
	ns: ["common", "stations", "nav", "map", "stationDetails", "submissions", "clfExport"],
	interpolation: {
		escapeValue: false,
	},
	react: {
		useSuspense: false,
		bindI18n: "languageChanged loaded",
		bindI18nStore: "added removed",
	},
});

export default i18n;
