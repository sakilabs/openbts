import { z } from "zod/v4";
import { eq, and } from "drizzle-orm";

import db from "../../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../../errors.js";
import { verifyPermissions } from "../../../../../../../plugins/auth/utils.js";
import { createAuditLog } from "../../../../../../../services/auditLog.service.js";
import { locationPhotos } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({ location_id: z.coerce.number(), photo_id: z.coerce.number() }),
  body: z.object({ note: z.string().max(100) }),
  response: {
    200: z.object({ data: z.object({ id: z.number(), note: z.string().nullable() }) }),
  },
};

type ReqParams = { Params: { location_id: number; photo_id: number } };
type ReqBody = { Body: { note: string } };
type RequestData = ReqParams & ReqBody;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<{ id: number; note: string | null }>>) {
  const { location_id, photo_id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { stations: ["update"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const photo = await db.query.locationPhotos.findFirst({
    where: { id: photo_id, location_id },
  });
  if (!photo) throw new ErrorResponse("NOT_FOUND");

  const noteValue = req.body.note.trim() || null;
  const [updated] = await db
    .update(locationPhotos)
    .set({ note: noteValue })
    .where(and(eq(locationPhotos.id, photo_id), eq(locationPhotos.location_id, location_id)))
    .returning({ id: locationPhotos.id, note: locationPhotos.note });

  await createAuditLog(
    { action: "location_photos.update", table_name: "location_photos", record_id: photo_id, old_values: photo, new_values: updated },
    req,
  );

  return res.send({ data: { id: photo_id, note: updated?.note ?? null } });
}

const updateLocationPhoto: Route<RequestData, { id: number; note: string | null }> = {
  url: "/locations/:location_id/photos/:photo_id",
  method: "PATCH",
  schema: schemaRoute,
  config: { permissions: ["update:stations"] },
  handler,
};

export default updateLocationPhoto;
