import { regions } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-orm/zod";
import type { RouteGenericInterface } from "fastify";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const regionsSchema = createSelectSchema(regions);
const schemaRoute = {
  response: {
    200: z.object({
      data: z.array(regionsSchema),
    }),
  },
};
type Region = z.infer<typeof regionsSchema>;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Region[]>>) {
  const regions = await db.query.regions.findMany({
    orderBy: { name: "asc" },
  });
  return res.send({ data: regions });
}

const getRegions: Route<RouteGenericInterface, Region[]> = {
  url: "/regions",
  method: "GET",
  config: { permissions: ["read:regions"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getRegions;
