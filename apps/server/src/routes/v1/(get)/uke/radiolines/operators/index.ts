import { ukeOperators } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-orm/zod";
import type { RouteGenericInterface } from "fastify";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const ukeOperatorsSchema = createSelectSchema(ukeOperators);
const schemaRoute = {
  response: {
    200: z.object({
      data: z.array(ukeOperatorsSchema),
    }),
  },
};
type ResponseData = z.infer<typeof ukeOperatorsSchema>;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
  const operators = await db.query.ukeOperators.findMany();
  return res.send({ data: operators });
}

const getUkeRadioLineOperators: Route<RouteGenericInterface, ResponseData[]> = {
  url: "/uke/radiolines/operators",
  method: "GET",
  config: { permissions: ["read:uke_radiolines"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getUkeRadioLineOperators;
