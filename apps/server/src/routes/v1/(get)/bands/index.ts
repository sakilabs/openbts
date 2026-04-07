import { bands } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-orm/zod";
import type { RouteGenericInterface } from "fastify";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const bandSelectSchema = createSelectSchema(bands);
type Bands = z.infer<typeof bandSelectSchema>;

const schemaRoute = {
  response: {
    200: z.object({
      data: z.array(bandSelectSchema),
    }),
  },
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Bands[]>>) {
  const bands = await db.query.bands.findMany();
  return res.send({ data: bands });
}

const getBands: Route<RouteGenericInterface, Bands[]> = {
  url: "/bands",
  method: "GET",
  config: { permissions: ["read:bands"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getBands;
