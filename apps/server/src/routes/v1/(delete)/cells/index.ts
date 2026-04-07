import { eq, inArray } from "drizzle-orm";
import { cells, stations } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  body: z.object({
    ids: z.array(z.number().int().positive()).min(1),
  }),
};

type ReqBody = { Body: z.infer<typeof schemaRoute.body> };

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<EmptyResponse>) {
  const { ids } = req.body;

  const foundCells = await db.query.cells.findMany({
    where: { id: { in: ids } },
  });

  if (foundCells.length !== ids.length) throw new ErrorResponse("NOT_FOUND");

  const uniqueStationIds = [...new Set(foundCells.map((c) => c.station_id))];

  try {
    await db.transaction(async (tx) => {
      await tx.delete(cells).where(inArray(cells.id, ids));

      await createAuditLog(
        {
          action: "cells.delete",
          table_name: "cells",
          record_id: null,
          old_values: { cells: foundCells },
          new_values: null,
        },
        req,
        tx,
      );

      /* eslint-disable no-await-in-loop */
      for (const stationId of uniqueStationIds) {
        await tx.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, stationId));
        await createAuditLog(
          {
            action: "stations.update",
            table_name: "stations",
            record_id: stationId,
            new_values: { updatedAt: new Date() },
            metadata: { reason: "cells.delete" },
          },
          req,
          tx,
        );
      }
      /* eslint-enable no-await-in-loop */
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_DELETE");
  }
}

const deleteCellsBatch: Route<ReqBody, void> = {
  url: "/cells",
  method: "DELETE",
  config: { permissions: ["delete:cells"] },
  schema: schemaRoute,
  handler,
};

export default deleteCellsBatch;
