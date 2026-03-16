import { setImmediate } from "node:timers/promises";

export type CellInput =
  | { rat: "GSM"; mnc: number; lac: number; cid: number }
  | { rat: "UMTS"; mnc: number; lac: number; cid: number; rnc: number }
  | { rat: "LTE"; mnc: number; tac: number; enbid: number; clid: number; pci: number }
  | { rat: "NR"; mnc: number };

export type MatchedCell =
  | { rat: "GSM"; lac: number; cid: number }
  | { rat: "UMTS"; rnc: number; cid: number; lac: number | null }
  | { rat: "LTE"; enbid: number; clid: number | null; tac: number | null; pci: number | null }
  | { rat: "NR" };

export type AnalyzerResult<TStation = unknown> = {
  status: "found" | "probable" | "not_found" | "unsupported";
  station?: TStation;
  cell?: MatchedCell;
  warnings: string[];
};

type Pair = [a: number, b: number];
type PairMap = Map<number, Map<string, Pair>>;

export type LookupMaps<TStation> = {
  gsmMap: Map<string, { station: TStation; lac: number; cid: number }>;
  umtsRncMap: Map<string, { station: TStation; rnc: number; cid: number; lac: number | null }>;
  umtsLacMap: Map<string, { station: TStation; rnc: number; cid: number; lac: number | null }>;
  lteMap: Map<string, { station: TStation; enbid: number; clid: number; tac: number | null; pci: number | null }>;
  lteEnbidMap: Map<string, { station: TStation; enbid: number }>;
};

export type CellGroups = {
  gsmByMnc: PairMap;
  umtsRncByMnc: PairMap;
  umtsLacByMnc: PairMap;
  lteByMnc: PairMap;
  lteEnbidsByMnc: Map<number, Set<number>>;
};

export function addPair(byMnc: PairMap, mnc: number, a: number, b: number): void {
  let inner = byMnc.get(mnc);
  if (!inner) {
    inner = new Map();
    byMnc.set(mnc, inner);
  }
  inner.set(`${a}:${b}`, [a, b]);
}

export function pairKey(mnc: number, a: number, b: number): string {
  return `${mnc}:${a}:${b}`;
}

export function groupCellsByMnc(inputCells: CellInput[]): CellGroups {
  const gsmByMnc: PairMap = new Map();
  const umtsRncByMnc: PairMap = new Map();
  const umtsLacByMnc: PairMap = new Map();
  const lteByMnc: PairMap = new Map();
  const lteEnbidsByMnc = new Map<number, Set<number>>();

  for (const cell of inputCells) {
    switch (cell.rat) {
      case "GSM":
        addPair(gsmByMnc, cell.mnc, cell.lac, cell.cid);
        break;
      case "UMTS":
        addPair(umtsRncByMnc, cell.mnc, cell.rnc, cell.cid);
        addPair(umtsLacByMnc, cell.mnc, cell.lac, cell.cid);
        break;
      case "LTE": {
        addPair(lteByMnc, cell.mnc, cell.enbid, cell.clid);
        let enbids = lteEnbidsByMnc.get(cell.mnc);
        if (!enbids) {
          enbids = new Set();
          lteEnbidsByMnc.set(cell.mnc, enbids);
        }
        enbids.add(cell.enbid);
        break;
      }
    }
  }

  return { gsmByMnc, umtsRncByMnc, umtsLacByMnc, lteByMnc, lteEnbidsByMnc };
}

const NOT_FOUND: AnalyzerResult<never> = { status: "not_found", warnings: [] };
const UNSUPPORTED: AnalyzerResult<never> = { status: "unsupported", warnings: [] };

export function resolveCell<TStation>(cell: CellInput, maps: LookupMaps<TStation>): AnalyzerResult<TStation> {
  switch (cell.rat) {
    case "NR":
      return UNSUPPORTED;

    case "GSM": {
      const entry = maps.gsmMap.get(pairKey(cell.mnc, cell.lac, cell.cid));
      if (!entry) return NOT_FOUND;
      return { status: "found", station: entry.station, cell: { rat: "GSM", lac: entry.lac, cid: entry.cid }, warnings: [] };
    }

    case "UMTS": {
      const primary = maps.umtsRncMap.get(pairKey(cell.mnc, cell.rnc, cell.cid));
      if (primary) {
        const warnings: string[] = [];
        if (primary.lac !== null && primary.lac !== cell.lac) warnings.push("lac_mismatch");
        return { status: "found", station: primary.station, cell: { rat: "UMTS", rnc: primary.rnc, cid: primary.cid, lac: primary.lac }, warnings };
      }
      const fallback = maps.umtsLacMap.get(pairKey(cell.mnc, cell.lac, cell.cid));
      if (!fallback) return NOT_FOUND;
      return {
        status: "probable",
        station: fallback.station,
        cell: { rat: "UMTS", rnc: fallback.rnc, cid: fallback.cid, lac: fallback.lac },
        warnings: ["rnc_mismatch"],
      };
    }

    case "LTE": {
      const primary = maps.lteMap.get(pairKey(cell.mnc, cell.enbid, cell.clid));
      if (primary) {
        const warnings: string[] = [];
        if (primary.tac !== null && primary.tac !== cell.tac) warnings.push("tac_mismatch");
        if (primary.pci !== null && primary.pci !== cell.pci) warnings.push("pci_mismatch");
        return {
          status: "found",
          station: primary.station,
          cell: { rat: "LTE", enbid: primary.enbid, clid: primary.clid, tac: primary.tac, pci: primary.pci },
          warnings,
        };
      }
      const fallback = maps.lteEnbidMap.get(`${cell.mnc}:${cell.enbid}`);
      if (!fallback) return NOT_FOUND;
      return {
        status: "probable",
        station: fallback.station,
        cell: { rat: "LTE", enbid: fallback.enbid, clid: null, tac: null, pci: null },
        warnings: ["enbid_only"],
      };
    }
  }
}

const YIELD_EVERY = 2000;

export async function resolveAllCells<TStation>(inputCells: CellInput[], maps: LookupMaps<TStation>): Promise<AnalyzerResult<TStation>[]> {
  const results: AnalyzerResult<TStation>[] = [];
  for (let i = 0; i < inputCells.length; i++) {
    const cell = inputCells[i];
    if (cell) results.push(resolveCell(cell, maps));
    // eslint-disable-next-line no-await-in-loop
    if (i % YIELD_EVERY === 0 && i > 0) await setImmediate();
  }
  return results;
}
