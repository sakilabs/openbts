import { cells, lteCells, stationSectors, stations } from "@openbts/drizzle";
import { and, eq, inArray } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const SIBLING_MNC: Record<number, number> = { 26002: 26003, 26003: 26002 };

function stripFirstDigit(enbid: number): number | null {
  if (enbid <= 0) return null;
  return enbid % 10 ** Math.floor(Math.log10(enbid));
}

function candidateEnbids(stripped: number): number[] {
  const magnitude = 10 ** (Math.floor(Math.log10(stripped)) + 1);
  return Array.from({ length: 9 }, (_, i) => stripped + (i + 1) * magnitude);
}

const sectorSchema = createSelectSchema(stationSectors).omit({ station_id: true });

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  response: {
    200: z.object({ data: z.array(sectorSchema) }),
  },
};

type ReqParams = { Params: { station_id: number } };
type ResponseData = z.infer<typeof sectorSchema>[];

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
  const { station_id } = req.params;

  const station = await db.query.stations.findFirst({
    where: { id: station_id },
    with: { operator: true },
  });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const mnc = station.operator?.mnc;
  if (!mnc || !(mnc in SIBLING_MNC) || !station.location_id) return res.send({ data: [] });

  const currentLteCells = await db
    .select({ enbid: lteCells.enbid })
    .from(lteCells)
    .innerJoin(cells, eq(cells.id, lteCells.cell_id))
    .where(eq(cells.station_id, station_id));

  if (currentLteCells.length === 0) return res.send({ data: [] });

  const stripped = [...new Set(currentLteCells.map(({ enbid }) => stripFirstDigit(enbid)).filter((value): value is number => value !== null))];
  if (stripped.length === 0) return res.send({ data: [] });

  const siblingOperator = await db.query.operators.findFirst({ where: { mnc: SIBLING_MNC[mnc]! } });
  if (!siblingOperator) return res.send({ data: [] });

  const [siblingRow] = await db
    .select({ stationId: stations.id })
    .from(lteCells)
    .innerJoin(cells, eq(cells.id, lteCells.cell_id))
    .innerJoin(stations, eq(stations.id, cells.station_id))
    .where(
      and(
        eq(stations.location_id, station.location_id),
        eq(stations.operator_id, siblingOperator.id),
        inArray(lteCells.enbid, stripped.flatMap(candidateEnbids)),
      ),
    )
    .limit(1);

  if (!siblingRow) return res.send({ data: [] });

  const sectors = await db.query.stationSectors.findMany({
    where: { station_id: siblingRow.stationId },
    columns: { station_id: false },
    orderBy: { id: "asc" },
  });

  return res.send({ data: sectors });
}

const getSiblingSectors: Route<ReqParams, ResponseData> = {
  url: "/stations/:station_id/sectors/sibling",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getSiblingSectors;
