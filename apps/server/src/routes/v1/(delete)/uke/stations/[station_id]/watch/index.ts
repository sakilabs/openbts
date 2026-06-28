import { ukeStationWatches } from "@openbts/drizzle";
import { and, eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../../errors.js";
import type { ReplyPayload } from "../../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../../interfaces/routes.interface.js";

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
    .delete(ukeStationWatches)
    .where(and(eq(ukeStationWatches.userId, session.user.id), eq(ukeStationWatches.ukeStationId, req.params.station_id)));

  return res.send({ data: { ok: true } });
}

const unwatchUkeStation: Route<ReqParams, ResponseData> = {
  url: "/uke/stations/:station_id/watch",
  method: "DELETE",
  schema: schemaRoute,
  handler,
};

export default unwatchUkeStation;
