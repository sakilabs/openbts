export function calculateComputedValues(type: "longCID" | "eCID" | "nci", details: Record<string, unknown>) {
  switch (type) {
    case "longCID":
      {
        const isRNCPresent = details.rnc !== null && details.rnc !== undefined && details.rnc !== 0;
        const isCIDPresent = details.cid !== null && details.cid !== undefined && details.cid !== 0;
        if (isRNCPresent && isCIDPresent) return (details.rnc as number) * 65536 + (details.cid as number);
      }
      break;
    case "eCID":
      {
        const isENBIDPresent = details.enbid !== null && details.enbid !== undefined && details.enbid !== 0;
        const isCLIDPresent = details.clid !== null && details.clid !== undefined && details.clid !== 0;
        if (isENBIDPresent && isCLIDPresent) return (details.enbid as number) * 256 + (details.clid as number);
      }
      break;
    case "nci":
      {
        const isGNBIDPresent = details.gnbid !== null && details.gnbid !== undefined && details.gnbid !== 0;
        const isCLIDPresent = details.clid !== null && details.clid !== undefined && details.clid !== 0;
        if (isGNBIDPresent && isCLIDPresent) {
          const gnbidLength = (details.gnbid_length as number) ?? 24;
          return (details.gnbid as number) * 2 ** (36 - gnbidLength) + (details.clid as number);
        }
      }
      break;
  }

  return null;
}
