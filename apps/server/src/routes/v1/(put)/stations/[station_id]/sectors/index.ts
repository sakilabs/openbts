import { cells, stationSectors } from "@openbts/drizzle";
import db from "@openbts/drizzle/db";
import { and, count, eq, inArray } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify";
import z from "zod";

import { ErrorResponse } from "../../../../../../errors.ts";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.ts";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.ts";
import { createAuditLog } from "../../../../../../services/auditLog.service.ts";

const sectorInputSchema = z.object({
  id: z.number().int().optional(),
  azimuth: z.number().int().min(0).max(359),
});
const sectorSchema = createSelectSchema(stationSectors).omit({ station_id: true });

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number() }),
  body: z.object({ sectors: z.array(sectorInputSchema) }),
  response: { 200: z.object({ data: z.array(sectorSchema) }) },
};
type ReqBodyParams = { Params: z.infer<typeof schemaRoute.params>; Body: z.infer<typeof schemaRoute.body> };
type ResBody = z.infer<typeof sectorSchema>[];

async function handler(req: FastifyRequest<ReqBodyParams>, res: ReplyPayload<JSONBody<ResBody>>) {
  const { station_id } = req.params;
  const { sectors } = req.body;
  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const previousSectors = await db.query.stationSectors.findMany({
    where: { station_id },
    columns: { station_id: false },
    orderBy: { id: "asc" },
  });

  const stationCells = await db.query.cells.findMany({ where: { station_id }, columns: { band_id: true } });
  const cellsByBand = new Map<number, number>();
  for (const cell of stationCells) cellsByBand.set(cell.band_id, (cellsByBand.get(cell.band_id) ?? 0) + 1);
  const maxSectors = cellsByBand.size > 0 ? Math.max(...cellsByBand.values()) : 0;
  if (sectors.length > maxSectors)
    throw new ErrorResponse("BAD_REQUEST", { message: `Too many sectors for the station cells. Maximum allowed is ${maxSectors}` });

  const result = await db.transaction(async (tx) => {
    const previousById = new Map(previousSectors.map((sector) => [sector.id, sector]));
    const usedPreviousIds = new Set<number>();
    const nextSectors: ResBody = [];

    for (const sector of sectors) {
      const matchingPrevious =
        sector.id !== undefined
          ? previousById.get(sector.id)
          : previousSectors.find((previous) => previous.azimuth === sector.azimuth && !usedPreviousIds.has(previous.id));

      if (matchingPrevious) {
        usedPreviousIds.add(matchingPrevious.id);
        if (matchingPrevious.azimuth !== sector.azimuth)
          await tx
            .update(stationSectors)
            .set({ azimuth: sector.azimuth })
            .where(and(eq(stationSectors.id, matchingPrevious.id), eq(stationSectors.station_id, station_id)));
        nextSectors.push({ id: matchingPrevious.id, azimuth: sector.azimuth });
        continue;
      }

      const [inserted] = await tx
        .insert(stationSectors)
        .values({ station_id, azimuth: sector.azimuth })
        .returning({ id: stationSectors.id, azimuth: stationSectors.azimuth });
      if (inserted) nextSectors.push(inserted);
    }

    const deletedIds = previousSectors.filter((sector) => !usedPreviousIds.has(sector.id)).map((sector) => sector.id);
    if (deletedIds.length > 0) {
      const [assignedResult] = await tx.select({ value: count() }).from(cells).where(inArray(cells.sector_id, deletedIds));
      if (Number(assignedResult?.value ?? 0) > 0)
        throw new ErrorResponse("BAD_REQUEST", { message: "Cannot delete sectors that are already assigned to cells" });
      await tx.delete(stationSectors).where(inArray(stationSectors.id, deletedIds));
    }

    return nextSectors;
  });

  await createAuditLog(
    {
      action: "stations.update",
      table_name: "station_sectors",
      record_id: station_id,
      old_values: previousSectors,
      new_values: result,
      metadata: { station_id },
    },
    req,
  );

  return res.send({ data: result });
}

const putSectors: Route<ReqBodyParams, ResBody> = {
  url: "/stations/:station_id/sectors",
  method: "PUT",
  config: { permissions: ["write:stations"] },
  schema: schemaRoute,
  handler,
};

export default putSectors;
