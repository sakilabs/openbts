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
      data: z.object({ watched: z.boolean() }),
    }),
  },
};

type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ResponseData = { watched: boolean };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const watch = await db.query.ukeStationWatches.findFirst({
    where: {
      AND: [{ userId: { eq: session.user.id } }, { ukeStationId: { eq: req.params.station_id } }],
    },
    columns: { id: true },
  });

  return res.send({ data: { watched: watch !== undefined } });
}

const getUkeStationWatch: Route<ReqParams, ResponseData> = {
  url: "/uke/stations/:station_id/watch",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getUkeStationWatch;
