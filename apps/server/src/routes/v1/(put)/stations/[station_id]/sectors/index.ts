import { stationSectors } from "@openbts/drizzle";
import db from "@openbts/drizzle/db";
import { eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify";
import z from "zod";

import { ErrorResponse } from "../../../../../../errors.ts";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.ts";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.ts";

const sectorInputSchema = z.object({
  azimuth: z.number().int().min(0).max(359),
});
const sectorSchema = createSelectSchema(stationSectors).omit({ station_id: true });

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number() }),
  body: z.object({ sectors: z.array(sectorInputSchema).max(15) }),
  response: { 200: z.object({ data: z.array(sectorSchema) }) },
};
type ReqBodyParams = { Params: z.infer<typeof schemaRoute.params>; Body: z.infer<typeof schemaRoute.body> };
type ResBody = z.infer<typeof sectorSchema>[];

async function handler(req: FastifyRequest<ReqBodyParams>, res: ReplyPayload<JSONBody<ResBody>>) {
  const { station_id } = req.params;
  const { sectors } = req.body;
  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const result = await db.transaction(async (tx) => {
    await tx.delete(stationSectors).where(eq(stationSectors.station_id, station_id));
    if (sectors.length === 0) return [];
    return tx
      .insert(stationSectors)
      .values(sectors.map((sector) => ({ ...sector, station_id })))
      .returning({ id: stationSectors.id, azimuth: stationSectors.azimuth });
  });

  return res.send({ data: result.sort((a, b) => a.id - b.id) });
}

const putSectors: Route<ReqBodyParams, ResBody> = {
  url: "/stations/:stations_id/sectors",
  method: "PUT",
  config: { permissions: ["write:stations"] },
  schema: schemaRoute,
  handler,
};

export default putSectors;
