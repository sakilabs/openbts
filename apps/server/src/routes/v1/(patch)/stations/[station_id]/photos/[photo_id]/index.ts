import { z } from "zod/v4";
import { eq, and } from "drizzle-orm";

import db from "../../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../../errors.js";
import { verifyPermissions } from "../../../../../../../plugins/auth/utils.js";
import { createAuditLog } from "../../../../../../../services/auditLog.service.js";
import { stationPhotos } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number(), photo_id: z.coerce.number() }),
  body: z
    .object({ is_main: z.literal(true).optional(), note: z.string().max(100).optional() })
    .refine((b) => b.is_main !== undefined || b.note !== undefined, { message: "At least one field required" }),
  response: {
    200: z.object({ data: z.object({ id: z.number(), is_main: z.boolean(), note: z.string().nullable() }) }),
  },
};

type ReqParams = { Params: { station_id: number; photo_id: number } };
type ReqBody = { Body: { is_main?: true; note?: string } };
type RequestData = ReqParams & ReqBody;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<{ id: number; is_main: boolean; note: string | null }>>) {
  const { station_id, photo_id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { stations: ["update"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const photo = await db.query.stationPhotos.findFirst({
    where: { id: photo_id, station_id },
  });
  if (!photo) throw new ErrorResponse("NOT_FOUND");

  if (req.body.is_main) {
    await db.transaction(async (tx) => {
      await tx.update(stationPhotos).set({ is_main: false }).where(eq(stationPhotos.station_id, station_id));
      await tx
        .update(stationPhotos)
        .set({ is_main: true })
        .where(and(eq(stationPhotos.id, photo_id), eq(stationPhotos.station_id, station_id)));
    });
  }

  if (req.body.note !== undefined) {
    const noteValue = req.body.note.trim() || null;
    await db
      .update(stationPhotos)
      .set({ note: noteValue })
      .where(and(eq(stationPhotos.id, photo_id), eq(stationPhotos.station_id, station_id)));
  }

  const updated = await db.query.stationPhotos.findFirst({ where: { id: photo_id, station_id } });

  await createAuditLog(
    { action: "station_photos.update", table_name: "station_photos", record_id: photo_id, old_values: photo, new_values: updated },
    req,
  );

  return res.send({ data: { id: photo_id, is_main: updated?.is_main ?? photo.is_main, note: updated?.note ?? null } });
}

const updateStationPhoto: Route<RequestData, { id: number; is_main: boolean; note: string | null }> = {
  url: "/stations/:station_id/photos/:photo_id",
  method: "PATCH",
  schema: schemaRoute,
  config: { permissions: ["update:stations"] },
  handler,
};

export default updateStationPhoto;
