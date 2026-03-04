import { z } from "zod/v4";
import { eq, and } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs/promises";

import db from "../../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../../errors.js";
import { verifyPermissions } from "../../../../../../../plugins/auth/utils.js";
import { createAuditLog } from "../../../../../../../services/auditLog.service.js";
import { stationPhotos, attachments } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../../interfaces/routes.interface.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number(), photo_id: z.coerce.number() }),
  response: { 204: z.object({}) },
};

type ReqParams = { Params: { station_id: number; photo_id: number } };
type RequestData = ReqParams;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<Record<never, never>>>) {
  const { station_id, photo_id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { stations: ["update"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const photo = await db.query.stationPhotos.findFirst({
    where: { id: photo_id, station_id },
  });
  if (!photo) throw new ErrorResponse("NOT_FOUND");

  const attachment = await db.query.attachments.findFirst({ where: { id: photo.attachment_id } });

  await db.delete(stationPhotos).where(and(eq(stationPhotos.id, photo_id), eq(stationPhotos.station_id, station_id)));

  if (photo.is_main) {
    const next = await db.query.stationPhotos.findFirst({ where: { station_id } });
    if (next) {
      await db.update(stationPhotos).set({ is_main: true }).where(eq(stationPhotos.id, next.id));
    }
  }

  if (attachment) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, `${attachment.uuid}.webp`));
    } catch {}
    await db.delete(attachments).where(eq(attachments.id, attachment.id));
  }

  await createAuditLog({ action: "station_photos.delete", table_name: "station_photos", record_id: photo_id, old_values: photo }, req);

  return res.code(204).send({});
}

const deleteStationPhoto: Route<RequestData, Record<never, never>> = {
  url: "/stations/:station_id/photos/:photo_id",
  method: "DELETE",
  schema: schemaRoute,
  config: { permissions: ["update:stations"] },
  handler,
};

export default deleteStationPhoto;
