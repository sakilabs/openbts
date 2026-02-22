export type CellLike = {
  id: string;
  rat: string;
  details: Record<string, unknown> | object;
};

export function findDuplicateCids(cells: CellLike[]): [rat: string, duplicateIds: string[]][] {
  const results: [string, string[]][] = [];

  for (const rat of ["GSM", "UMTS"] as const) {
    const ratCells = cells.filter((c) => c.rat === rat);
    const cidMap = new Map<number, string[]>();
    for (const cell of ratCells) {
      const cid = (cell.details as { cid?: number }).cid;
      if (cid === undefined) continue;
      if (!cidMap.has(cid)) cidMap.set(cid, []);
      cidMap.get(cid)!.push(cell.id);
    }

    for (const [, cellIds] of cidMap) {
      if (cellIds.length > 1) results.push([rat, cellIds]);
    }
  }

  return results;
}

export function findDuplicateEnbidClids(cells: CellLike[]): string[] {
  const lteCells = cells.filter((c) => c.rat === "LTE");
  const enbidClidMap = new Map<string, string[]>();
  for (const cell of lteCells) {
    const d = cell.details as { enbid?: number; clid?: number };
    if (d.enbid === undefined || d.clid === undefined) continue;
    const key = `${d.enbid}:${d.clid}`;
    if (!enbidClidMap.has(key)) enbidClidMap.set(key, []);
    enbidClidMap.get(key)!.push(cell.id);
  }

  const duplicateIds: string[] = [];
  for (const [, cellIds] of enbidClidMap) {
    if (cellIds.length > 1) duplicateIds.push(...cellIds);
  }
  return duplicateIds;
}
