import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { ukePermits, ukePermitSectors, bands, ukeLocations, operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const permitsSchema = createSelectSchema(ukePermits).omit({ band_id: true, operator_id: true, location_id: true });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators);
const ukeLocationsSchema = createSelectSchema(ukeLocations);
const sectorsSchema = createSelectSchema(ukePermitSectors).omit({ permit_id: true });
const schemaRoute = {
  params: z.object({
    id: z.coerce.number<number>(),
  }),
  response: {
    200: z.object({
      data: permitsSchema.extend({
        band: bandsSchema,
        operator: operatorsSchema,
        location: ukeLocationsSchema,
        sectors: z.array(sectorsSchema),
      }),
    }),
  },
};
type Permit = z.infer<typeof permitsSchema> & {
  band: z.infer<typeof bandsSchema>;
  operator: z.infer<typeof operatorsSchema>;
  location: z.infer<typeof ukeLocationsSchema>;
  sectors: z.infer<typeof sectorsSchema>[];
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Permit>>) {
  const { id } = req.params;

  try {
    const permit = await db.query.ukePermits.findFirst({
      columns: {
        band_id: false,
        operator_id: false,
        location_id: false,
      },
      with: {
        band: true,
        operator: true,
        location: true,
        sectors: {
          columns: {
            permit_id: false,
          },
        },
      },
      where: {
        id: id,
      },
    });
    if (!permit) throw new ErrorResponse("NOT_FOUND");

    return res.send({
      data: permit,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR");
  }
}

const getUkePermit: Route<IdParams, Permit> = {
  url: "/uke/permits/:id",
  method: "GET",
  config: { permissions: ["read:uke_permits"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getUkePermit;
