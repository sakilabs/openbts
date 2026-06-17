export type RatComputedField = "longCID" | "eCID" | "nci";

export type RatDetailFieldKind = "number" | "boolean" | "select" | "computed";

export type RatDetailField = {
  key: string;
  label: string;
  tooltip?: string;
  kind: RatDetailFieldKind;
  placeholder?: string;
  max?: number;
  computed?: RatComputedField;
  valueKey?: string;
};

export type RatDetailFieldView = "editor" | "station";

const RAT_DETAIL_FIELDS: Record<string, { editor: readonly RatDetailField[]; station: readonly RatDetailField[] }> = {
  GSM: {
    editor: [
      { key: "lac", label: "LAC", tooltip: "Local Area Code", kind: "number", max: 65535 },
      { key: "cid", label: "CID", tooltip: "Cell ID", kind: "number", max: 65535 },
      { key: "e_gsm", label: "E-GSM", kind: "boolean" },
    ],
    station: [
      { key: "lac", label: "LAC", tooltip: "Local Area Code", kind: "number" },
      { key: "cid", label: "CID", tooltip: "Cell ID", kind: "number" },
    ],
  },
  UMTS: {
    editor: [
      { key: "lac", label: "LAC", tooltip: "Local Area Code", kind: "number", max: 65535 },
      { key: "rnc", label: "RNC", tooltip: "Radio Network Controller", kind: "number", max: 65535 },
      { key: "cid", label: "CID", tooltip: "Cell ID", kind: "number", max: 65535 },
      {
        key: "cid_long",
        label: "LongCID",
        tooltip: "Long Cell ID · (RNC * 65536) + CID",
        kind: "computed",
        computed: "longCID",
        valueKey: "cid_long",
      },
      { key: "arfcn", label: "UARFCN", tooltip: "UTRA Absolute Radio Frequency Channel Number", kind: "number", max: 16383 },
    ],
    station: [
      { key: "lac", label: "LAC", tooltip: "Local Area Code", kind: "number" },
      { key: "rnc", label: "RNC", tooltip: "Radio Network Controller", kind: "number" },
      { key: "cid", label: "CID", tooltip: "Cell ID", kind: "number" },
      {
        key: "cid_long",
        label: "LongCID",
        tooltip: "Long Cell ID · (RNC * 65536) + CID",
        kind: "computed",
        computed: "longCID",
        valueKey: "cid_long",
      },
      { key: "arfcn", label: "UARFCN", tooltip: "UTRA Absolute Radio Frequency Channel Number", kind: "number" },
    ],
  },
  LTE: {
    editor: [
      { key: "tac", label: "TAC", tooltip: "Tracking Area Code", kind: "number", max: 65535 },
      { key: "enbid", label: "eNBID", tooltip: "eNodeB ID", kind: "number", max: 1048575 },
      { key: "clid", label: "CLID", tooltip: "Cell Local ID", kind: "number", max: 255 },
      { key: "ecid", label: "E-CID", tooltip: "Enhanced CID · (eNBID * 256) + CLID", kind: "computed", computed: "eCID", valueKey: "ecid" },
      { key: "pci", label: "PCI", tooltip: "Physical Cell ID", kind: "number", max: 503 },
      { key: "earfcn", label: "EARFCN", tooltip: "E-UTRA Absolute Radio Frequency Channel Number", kind: "number", max: 262143 },
      { key: "supports_iot", label: "IoT", kind: "boolean" },
    ],
    station: [
      { key: "tac", label: "TAC", tooltip: "Tracking Area Code", kind: "number" },
      { key: "enbid", label: "eNBID", tooltip: "eNodeB ID", kind: "number" },
      { key: "clid", label: "CLID", tooltip: "Cell Local ID", kind: "number" },
      { key: "ecid", label: "E-CID", tooltip: "Enhanced CID · (eNBID * 256) + CLID", kind: "computed", computed: "eCID", valueKey: "ecid" },
      { key: "pci", label: "PCI", tooltip: "Physical Cell ID", kind: "number" },
      { key: "earfcn", label: "EARFCN", tooltip: "E-UTRA Absolute Radio Frequency Channel Number", kind: "number" },
    ],
  },
  NR: {
    editor: [
      { key: "type", label: "Type", kind: "select" },
      { key: "nrtac", label: "TAC", tooltip: "Tracking Area Code", kind: "number", max: 16777215 },
      { key: "clid", label: "CLID", tooltip: "Cell Local ID", kind: "number", max: 16383 },
      { key: "gnbid", label: "gNBID", tooltip: "gNodeB ID (22-32 bits)", kind: "number", max: 4294967295 },
      { key: "nci", label: "NCI", tooltip: "NR Cell Identity", kind: "computed", computed: "nci", valueKey: "nci" },
      { key: "pci", label: "PCI", tooltip: "Physical Cell ID", kind: "number", max: 1007 },
      { key: "arfcn", label: "ARFCN", tooltip: "Absolute Radio Frequency Channel Number", kind: "number", max: 3279165 },
      { key: "supports_nr_redcap", label: "RedCap", kind: "boolean" },
    ],
    station: [
      { key: "nrtac", label: "TAC", tooltip: "Tracking Area Code", kind: "number" },
      { key: "clid", label: "CLID", tooltip: "Cell Local ID", kind: "number" },
      { key: "gnbid", label: "gNBID", tooltip: "gNodeB ID (22-32 bits)", kind: "number" },
      { key: "nci", label: "NCI", tooltip: "NR Cell Identity", kind: "computed", computed: "nci", valueKey: "nci" },
      { key: "pci", label: "PCI", tooltip: "Physical Cell ID", kind: "number" },
      { key: "arfcn", label: "ARFCN", tooltip: "Absolute Radio Frequency Channel Number", kind: "number" },
    ],
  },
};

export function getRatDetailFields(rat: string, view: RatDetailFieldView = "editor"): readonly RatDetailField[] {
  return RAT_DETAIL_FIELDS[rat]?.[view] ?? [];
}

export function getRatDetailFieldLabel(rat: string, key: string, view: RatDetailFieldView = "editor"): string {
  return getRatDetailFields(rat, view).find((field) => field.key === key)?.label ?? key.toUpperCase();
}
