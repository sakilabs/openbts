export interface RawUkeData {
	"Nazwa Operatora": string;
	"Nr Decyzji": string;
	"Rodzaj decyzji": "zmP" | "P";
	"Data ważności": number | string;
	"Dł geogr stacji": string;
	"Szer geogr stacji": string;
	Miejscowość: string;
	Lokalizacja: string;
	IdStacji: string;
	TERYT: string;
}

export interface RawUkePermitDeviceData {
	"Nr alternatywny": string | null;
	"Numer operatora": string | null;
	"Data wniosku operatora": number | string | null;
	"Nr alternatywny wniosku": string | null;
	"Nr modyfikacji": number | string | null;
	"Rodzaj wniosku": string | null;
	"Id stacji": string | null;
	"Nazwa stacji": string | null;
	Miejscowość: string | null;
	Ulica: string | null;
	"Nr domu": string | null;
	"Dodatkowy opis lokalizacji": string | null;
	"Dł geogr.": number | string | null;
	"Szer. geogr.": number | string | null;
	"H terenu": number | string | null;
	AAS: string | null;
	NCC: string | null;
	LAC: string | null;
	MNC: string | null;
	"Kod GUS": string | null;
	"Rodzaj systemu komórki": string | null;
	"Typ komórki": string | null;
	"H anteny": number | string | null;
	Polaryzacja: string | null;
	ERP: number | string | null;
	DSB: number | string | null;
	"Chka poz": number | string | null;
	"Chka pion": number | string | null;
	Azymut: number | string | null;
	Elewacja: number | string | null;
	"Dl geogr. śr.": number | string | null;
	"Szer. geogr. śr.": number | string | null;
	"R obszaru": number | string | null;
	Urządzenia: string | null;
	"Dane kanału (P) lub lub dane zakresu (Z)": string | null;
}

export interface RawRadioLineData {
	"L.p.": number;

	Dl_geo_Tx: string;
	Sz_geo_Tx: string;
	"H_t_Tx [m npm]": string;
	"Miejscowość Tx": string;
	"Województwo Tx": string;
	"Ulica Tx": string;
	"Opis położenia Tx": string;

	Dl_geo_Rx: string;
	Sz_geo_Rx: string;
	"H_t_Rx [m npm]": string;
	"Miejscowość Rx": string;
	"Województwo Rx": string;
	"Ulica Rx": string;
	"Opis położenia Rx": string;

	"f [GHz]": string;
	Nr_kan: string;
	Symbol_planu: string;
	"Szer_kan [MHz]": string;
	Polaryzacja: string;
	"Rodz_modu-lacji": string;
	"Przepływność [Mb/s]": number | string;

	"EIRP [dBm]": string;
	"Tłum_ant_odb_Rx [dB]": string;
	Typ_nad: string;
	Prod_nad: string;
	"Liczba_szum_Rx [dB]": string;
	"Tłum_ATPC [dB]": string;
	Typ_ant_Tx: string;
	Prod_ant_Tx: string;
	"Zysk_ant_Tx [dBi]": string;
	"H_ant_Tx [m npt]": string;

	Typ_ant_Rx: string;
	Prod_ant_Rx: string;
	"Zysk_ant_Rx [dBi]": string;
	"H_ant_Rx [m npt]": string;

	Operator: string;
	"Nr_pozw/dec": string;
	Rodz_dec: string;
	Data_wydania: number;
	"Data_ważn_pozw/dec": number;
}
