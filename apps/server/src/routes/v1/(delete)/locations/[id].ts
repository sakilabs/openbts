import { eq } from "drizzle-orm";
import { locations, stations } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, Route, EmptyResponse } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({
    id: z.coerce.number<number>(),
  }),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<EmptyResponse>) {
  const { id } = req.params;

  const location = await db.query.locations.findFirst({
    where: {
      id: id,
    },
    with: { region: { columns: { id: true, name: true, code: true } } },
  });
  if (!location) throw new ErrorResponse("NOT_FOUND");

  const stationCount = await db.$count(stations, eq(stations.location_id, id));
  if (stationCount > 0) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot delete a location that has stations assigned to it." });

  try {
    await db.delete(locations).where(eq(locations.id, id));
    await createAuditLog({ action: "locations.delete", table_name: "locations", record_id: id, old_values: location }, req);
  } catch {
    throw new ErrorResponse("FAILED_TO_DELETE");
  }

  return res.status(204).send();
}

const deleteLocation: Route<IdParams, void> = {
  url: "/locations/:id",
  method: "DELETE",
  config: { permissions: ["delete:locations"] },
  schema: schemaRoute,
  handler,
};

export default deleteLocation;
