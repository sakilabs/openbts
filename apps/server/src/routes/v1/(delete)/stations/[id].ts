import { eq, inArray } from "drizzle-orm";
import { stations, cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({
    id: z.coerce.number<number>(),
  }),
};
async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<EmptyResponse>) {
  const { id: stationId } = req.params;

  if (Number.isNaN(stationId)) throw new ErrorResponse("INVALID_QUERY");

  const station = await db.query.stations.findFirst({
    where: {
      id: stationId,
    },
  });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  try {
    await db.transaction(async (tx) => {
      const stationCells = await tx.query.cells.findMany({
        where: {
          station_id: stationId,
        },
        columns: { id: true, rat: true },
      });
      const cellIds = stationCells.map((c) => c.id);
      if (cellIds.length === 0) {
        await tx.delete(stations).where(eq(stations.id, stationId));
        return;
      }

      const gsmIds = stationCells.filter((c) => c.rat === "GSM").map((c) => c.id);
      const umtsIds = stationCells.filter((c) => c.rat === "UMTS").map((c) => c.id);
      const lteIds = stationCells.filter((c) => c.rat === "LTE").map((c) => c.id);
      const nrIds = stationCells.filter((c) => c.rat === "NR").map((c) => c.id);

      if (gsmIds.length > 0) await tx.delete(gsmCells).where(inArray(gsmCells.cell_id, gsmIds));
      if (umtsIds.length > 0) await tx.delete(umtsCells).where(inArray(umtsCells.cell_id, umtsIds));
      if (lteIds.length > 0) await tx.delete(lteCells).where(inArray(lteCells.cell_id, lteIds));
      if (nrIds.length > 0) await tx.delete(nrCells).where(inArray(nrCells.cell_id, nrIds));

      await tx.delete(cells).where(inArray(cells.id, cellIds));
      await tx.delete(stations).where(eq(stations.id, stationId));
    });

    return res.status(204).send();
  } catch {
    throw new ErrorResponse("FAILED_TO_DELETE");
  }
}

const deleteStation: Route<IdParams, void> = {
  url: "/stations/:id",
  method: "DELETE",
  schema: schemaRoute,
  config: { permissions: ["delete:stations"] },
  handler,
};

export default deleteStation;
