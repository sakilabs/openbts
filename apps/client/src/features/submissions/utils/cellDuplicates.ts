import { getRatCellSpecs } from "@/features/shared/rat";

export type CellLike = {
  id: string;
  rat: string;
  details: Record<string, unknown> | object;
};

export type DuplicateIdentityGroup = {
  rat: string;
  fields: readonly string[];
  duplicateIds: string[];
  messageKey: string;
};

function getDetailValue(details: Record<string, unknown> | object, field: string): unknown {
  return (details as Record<string, unknown>)[field];
}

export function findDuplicateIdentityGroups(cells: CellLike[]): DuplicateIdentityGroup[] {
  const results: DuplicateIdentityGroup[] = [];

  for (const spec of getRatCellSpecs()) {
    const ratCells = cells.filter((cell) => cell.rat === spec.value);
    for (const rule of spec.identityDuplicateRules ?? []) {
      const identityMap = new Map<string, string[]>();

      for (const cell of ratCells) {
        const values = rule.fields.map((field) => getDetailValue(cell.details, field));
        if (values.some((value) => value === undefined || value === null)) continue;

        const key = values.map(String).join(":");
        const cellIds = identityMap.get(key) ?? [];
        cellIds.push(cell.id);
        identityMap.set(key, cellIds);
      }

      for (const duplicateIds of identityMap.values()) {
        if (duplicateIds.length > 1) results.push({ rat: spec.value, fields: rule.fields, duplicateIds, messageKey: rule.messageKey });
      }
    }
  }

  return results;
}

export function findDuplicateCids(cells: CellLike[]): [rat: string, duplicateIds: string[]][] {
  return findDuplicateIdentityGroups(cells)
    .filter((group) => group.fields.length === 1 && group.fields[0] === "cid")
    .map((group): [rat: string, duplicateIds: string[]] => [group.rat, group.duplicateIds]);
}

export function findDuplicateEnbidClids(cells: CellLike[]): string[] {
  return findDuplicateIdentityGroups(cells)
    .filter((group) => group.rat === "LTE" && group.fields.length === 2 && group.fields.includes("enbid") && group.fields.includes("clid"))
    .flatMap((group) => group.duplicateIds);
}
