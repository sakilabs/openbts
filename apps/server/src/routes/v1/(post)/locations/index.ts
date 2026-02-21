import { locations } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const locationsSelectSchema = createSelectSchema(locations);
const locationsInsertSchema = createInsertSchema(locations).strict();
type ReqBody = { Body: z.infer<typeof locationsInsertSchema> };
type ResponseData = z.infer<typeof locationsSelectSchema>;
const schemaRoute = {
  body: locationsInsertSchema,
  response: {
    200: z.object({
      data: locationsSelectSchema,
    }),
  },
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  try {
    const [location] = await db.insert(locations).values(req.body).returning();

    if (!location) throw new ErrorResponse("FAILED_TO_CREATE");

    const locationWithRegion = await db.query.locations.findFirst({
      where: { id: location.id },
      with: { region: { columns: { id: true, name: true, code: true } } },
    });

    await createAuditLog(
      { action: "locations.create", table_name: "locations", record_id: location.id, new_values: locationWithRegion ?? location },
      req,
    );
    return res.send({ data: location });
  } catch {
    throw new ErrorResponse("FAILED_TO_CREATE");
  }
}

const createLocation: Route<ReqBody, ResponseData> = {
  url: "/locations",
  method: "POST",
  config: { permissions: ["write:locations"] },
  schema: schemaRoute,
  handler,
};

export default createLocation;
