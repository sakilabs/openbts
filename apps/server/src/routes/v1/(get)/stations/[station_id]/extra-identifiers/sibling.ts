import { cells, lteCells, stations } from "@openbts/drizzle";
import { and, eq, inArray } from "drizzle-orm";
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

const responseSchema = z.object({
  networks_id: z.int().nullable(),
  networks_name: z.string().nullable(),
  mno_name: z.string().nullable(),
});

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  response: {
    200: z.object({ data: responseSchema }),
  },
};

type ReqParams = { Params: { station_id: number } };
type ResponseData = z.infer<typeof responseSchema>;

const empty: ResponseData = { networks_id: null, networks_name: null, mno_name: null };

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
  if (!mnc || !(mnc in SIBLING_MNC) || !station.location_id) return res.send({ data: empty });

  const currentLteCells = await db
    .select({ enbid: lteCells.enbid })
    .from(lteCells)
    .innerJoin(cells, eq(cells.id, lteCells.cell_id))
    .where(eq(cells.station_id, station_id));

  if (currentLteCells.length === 0) return res.send({ data: empty });

  const stripped = [...new Set(currentLteCells.map(({ enbid }) => stripFirstDigit(enbid)).filter((s): s is number => s !== null))];
  if (stripped.length === 0) return res.send({ data: empty });

  const candidates = stripped.flatMap(candidateEnbids);

  const siblingMnc = SIBLING_MNC[mnc]!;
  const siblingOperator = await db.query.operators.findFirst({ where: { mnc: siblingMnc } });
  if (!siblingOperator) return res.send({ data: empty });

  const [siblingRow] = await db
    .select({ stationId: stations.id })
    .from(lteCells)
    .innerJoin(cells, eq(cells.id, lteCells.cell_id))
    .innerJoin(stations, eq(stations.id, cells.station_id))
    .where(and(eq(stations.location_id, station.location_id), eq(stations.operator_id, siblingOperator.id), inArray(lteCells.enbid, candidates)))
    .limit(1);

  if (!siblingRow) return res.send({ data: empty });

  const ids = await db.query.extraIdentificators.findFirst({ where: { station_id: siblingRow.stationId } });
  if (!ids) return res.send({ data: empty });

  return res.send({ data: { networks_id: ids.networks_id, networks_name: ids.networks_name, mno_name: ids.mno_name } });
}

const getSiblingExtraIdentifiers: Route<ReqParams, ResponseData> = {
  url: "/stations/:station_id/extra-identifiers/sibling",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getSiblingExtraIdentifiers;
