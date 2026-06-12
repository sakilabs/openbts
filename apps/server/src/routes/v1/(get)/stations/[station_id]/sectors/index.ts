import { stationSectors } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify";
import z from "zod";

import db from "../../../../../../database/psql.ts";
import { ErrorResponse } from "../../../../../../errors.ts";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.ts";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.ts";

const sectorSchema = createSelectSchema(stationSectors).omit({ station_id: true });

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number() }),
  response: { 200: z.object({ data: z.array(sectorSchema) }) },
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ResBody = z.infer<typeof sectorSchema>[];

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResBody>>) {
  const { station_id } = req.params;
  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const sectors = await db.query.stationSectors.findMany({
    where: {
      station_id: station_id,
    },
    columns: {
      station_id: false,
    },
    orderBy: { id: "asc" },
  });

  return res.send({ data: sectors });
}

const getSectors: Route<ReqParams, ResBody> = {
  url: "/stations/:station_id/sectors",
  method: "GET",
  config: { permissions: ["read:stations"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getSectors;
