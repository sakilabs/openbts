import { stationWatches } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  response: {
    200: z.object({
      data: z.object({ ok: z.boolean() }),
    }),
  },
};

type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ResponseData = { ok: boolean };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  await db
    .insert(stationWatches)
    .values({
      userId: session.user.id,
      stationId: req.params.station_id,
    })
    .onConflictDoNothing({ target: [stationWatches.userId, stationWatches.stationId] });

  return res.send({ data: { ok: true } });
}

const watchStation: Route<ReqParams, ResponseData> = {
  url: "/stations/:station_id/watch",
  method: "POST",
  schema: schemaRoute,
  handler,
};

export default watchStation;
