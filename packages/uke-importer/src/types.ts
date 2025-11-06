export interface RawUkeData {
	"Nazwa Operatora": string;
	"Nr Decyzji": string;
	"Rodzaj decyzji": "zmP" | "P";
	"Data ważności": string;
	"Dł geogr stacji": string;
	"Szer geogr stacji": string;
	Miejscowość: string;
	Lokalizacja: string;
	IdStacji: string;
	TERYT: string;
}

export interface RawRadioLineData {
	"Dł geo Tx": string;
	"Sz geo Tx": string;
	"H t Tx [m npm]": number;

	"Dł geo Rx": string;
	"Sz geo Rx": string;
	"H t Rx [m npm]": number;

	"F [GHz]": number;
	"Nr kan": number;
	"Symbol planu": string;
	"Szer kan [MHz]": number;
	Polaryzacja: string;
	"Rodz modulacji": string;
	"Przepływność [Mb/s]": string;

	"EIRP [dBm]": number;
	"Tłum ant odb Rx [dB]": number;
	"Typ nad": string;
	"Prod nad": string;
	"Typ ant Tx": string;
	"Prod ant Tx": string;
	"Zysk ant Tx [dBi]": number;
	"H ant Tx [m npt]": number;

	"Typ ant Rx": string;
	"Prod ant Rx": string;
	"Zysk ant Rx [dBi]": number;
	"H ant Rx [m npt]": number;
	"Liczba szum Rx [dB]": number;
	"Tłum ATPC [dB]": number;

	Operator: string;
	"Nr pozw/dec": string;
	"Rodz dec": string;
	"Data ważn pozw/dec": string;
}
