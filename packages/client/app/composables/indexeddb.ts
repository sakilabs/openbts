import Dexie, { type EntityTable } from "dexie";

export const db = new Dexie("btsfinder") as Dexie & {
	btsList: EntityTable<Stations, "bts_id">;
};
db.version(1).stores({
	btsList: "++id, owner, region, mno_id, type, longitude, latitude, location_type",
});

export type { Stations };
