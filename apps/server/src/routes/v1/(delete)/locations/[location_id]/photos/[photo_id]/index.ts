import { z } from "zod/v4";
import { eq, and } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs/promises";

import db from "../../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../../errors.js";
import { verifyPermissions } from "../../../../../../../plugins/auth/utils.js";
import { createAuditLog } from "../../../../../../../services/auditLog.service.js";
import { locationPhotos, attachments } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../../interfaces/routes.interface.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const schemaRoute = {
  params: z.object({ location_id: z.coerce.number(), photo_id: z.coerce.number() }),
  response: { 204: z.object({}) },
};

type ReqParams = { Params: { location_id: number; photo_id: number } };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Record<never, never>>>) {
  const { location_id, photo_id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { stations: ["update"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const photo = await db.query.locationPhotos.findFirst({
    where: { id: photo_id, location_id },
  });
  if (!photo) throw new ErrorResponse("NOT_FOUND");

  const attachment = await db.query.attachments.findFirst({ where: { id: photo.attachment_id } });

  await db.delete(locationPhotos).where(and(eq(locationPhotos.id, photo_id), eq(locationPhotos.location_id, location_id)));

  if (attachment) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, `${attachment.uuid}.webp`));
    } catch {}
    await db.delete(attachments).where(eq(attachments.id, attachment.id));
  }

  await createAuditLog({ action: "location_photos.delete", table_name: "location_photos", record_id: photo_id, old_values: photo }, req);

  return res.code(204).send({});
}

const deleteLocationPhoto: Route<ReqParams, Record<never, never>> = {
  url: "/locations/:location_id/photos/:photo_id",
  method: "DELETE",
  schema: schemaRoute,
  config: { permissions: ["update:stations"] },
  handler,
};

export default deleteLocationPhoto;
