export type RatComputedValueType = "longCID" | "eCID" | "nci";

export function calculateComputedValues(type: RatComputedValueType, details: Record<string, unknown>): number | null {
  switch (type) {
    case "longCID": {
      const rnc = details.rnc;
      const cid = details.cid;
      if (typeof rnc === "number" && rnc !== 0 && typeof cid === "number") return rnc * 65536 + cid;
      break;
    }
    case "eCID": {
      const enbid = details.enbid;
      const clid = details.clid;
      if (typeof enbid === "number" && enbid !== 0 && typeof clid === "number") return enbid * 256 + clid;
      break;
    }
    case "nci": {
      const gnbid = details.gnbid;
      const clid = details.clid;
      const gnbidLength = typeof details.gnbid_length === "number" ? details.gnbid_length : 24;
      if (typeof gnbid === "number" && gnbid !== 0 && typeof clid === "number") return gnbid * 2 ** (36 - gnbidLength) + clid;
      break;
    }
  }

  return null;
}
