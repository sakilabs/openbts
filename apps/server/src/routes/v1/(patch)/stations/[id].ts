import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { locations, stations } from "@openbts/drizzle";
import { createAuditLog } from "../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const stationsUpdateSchema = createUpdateSchema(stations)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const stationsSelectSchema = createSelectSchema(stations);
const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  body: stationsUpdateSchema,
  response: {
    200: z.object({
      data: stationsSelectSchema,
    }),
  },
};
type ReqBody = { Body: z.infer<typeof stationsUpdateSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof stationsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { station_id } = req.params;

  const station = await db.query.stations.findFirst({
    where: {
      id: station_id,
    },
  });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  try {
    const [updated] = await db
      .update(stations)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(stations.id, station_id))
      .returning();
    if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

    await createAuditLog(
      {
        action: "stations.update",
        table_name: "stations",
        record_id: station_id,
        old_values: station,
        new_values: updated,
      },
      req,
    );

    const oldLocationId = station.location_id;
    if (oldLocationId != null && oldLocationId !== updated.location_id) {
      try {
        const count = await db.$count(stations, eq(stations.location_id, oldLocationId));
        if (count === 0) {
          const oldLocation = await db.query.locations.findFirst({
            where: { id: oldLocationId },
            with: { region: { columns: { id: true, name: true, code: true } } },
          });
          await db.delete(locations).where(eq(locations.id, oldLocationId));
          await createAuditLog(
            {
              action: "locations.delete",
              table_name: "locations",
              record_id: oldLocationId,
              old_values: oldLocation ?? { id: oldLocationId },
              new_values: null,
              metadata: {
                station_id: station_id,
                reason: "stations.update",
              },
            },
            req,
          );
        }
      } catch {}
    }

    return res.send({ data: updated });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_UPDATE");
  }
}

const updateStation: Route<RequestData, ResponseData> = {
  url: "/stations/:station_id",
  method: "PATCH",
  config: { permissions: ["write:stations"] },
  schema: schemaRoute,
  handler,
};

export default updateStation;
