import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { locations } from "@openbts/drizzle";
import { createAuditLog } from "../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const locationsUpdateSchema = createUpdateSchema(locations).strict();
const locationsSelectSchema = createSelectSchema(locations);
const schemaRoute = {
  params: z.object({
    location_id: z.coerce.number<number>(),
  }),
  body: locationsUpdateSchema,
  response: {
    200: z.object({
      data: locationsSelectSchema,
    }),
  },
};
type ReqBody = { Body: z.infer<typeof locationsUpdateSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof locationsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { location_id } = req.params;
  if (Number.isNaN(location_id)) throw new ErrorResponse("INVALID_QUERY");

  const location = await db.query.locations.findFirst({
    where: {
      id: location_id,
    },
    with: { region: { columns: { id: true, name: true, code: true } } },
  });
  if (!location) throw new ErrorResponse("NOT_FOUND");

  try {
    const [updated] = await db.update(locations).set(req.body).where(eq(locations.id, location_id)).returning();
    if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

    const updatedWithRegion = await db.query.locations.findFirst({
      where: { id: location_id },
      with: { region: { columns: { id: true, name: true, code: true } } },
    });

    await createAuditLog(
      { action: "locations.update", table_name: "locations", record_id: location_id, old_values: location, new_values: updatedWithRegion ?? updated },
      req,
    );

    return res.send({
      data: updated,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_UPDATE");
  }
}

const updateLocation: Route<RequestData, ResponseData> = {
  url: "/locations/:location_id",
  method: "PATCH",
  schema: schemaRoute,
  config: { permissions: ["write:locations"] },
  handler,
};

export default updateLocation;
