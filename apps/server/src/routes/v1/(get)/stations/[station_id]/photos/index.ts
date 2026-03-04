import { z } from "zod/v4";
import { eq, asc, desc } from "drizzle-orm";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { stationPhotos, attachments, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number() }),
  response: {
    200: z.object({
      data: z.array(
        z.object({
          id: z.number(),
          attachment_uuid: z.string(),
          mime_type: z.string(),
          is_main: z.boolean(),
          note: z.string().nullable(),
          createdAt: z.string(),
          author: z.object({ uuid: z.string(), username: z.string(), name: z.string() }).nullable(),
        }),
      ),
    }),
  },
};

type ReqParams = { Params: { station_id: number } };
type RequestData = ReqParams;
type PhotoItem = {
  id: number;
  attachment_uuid: string;
  mime_type: string;
  is_main: boolean;
  note: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<PhotoItem[]>>) {
  const { station_id } = req.params;

  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const rows = await db
    .select({
      id: stationPhotos.id,
      attachment_uuid: attachments.uuid,
      mime_type: attachments.mime_type,
      is_main: stationPhotos.is_main,
      note: stationPhotos.note,
      createdAt: stationPhotos.createdAt,
      author_uuid: users.id,
      author_username: users.username,
      author_name: users.name,
    })
    .from(stationPhotos)
    .innerJoin(attachments, eq(stationPhotos.attachment_id, attachments.id))
    .leftJoin(users, eq(stationPhotos.uploaded_by, users.id))
    .where(eq(stationPhotos.station_id, station_id))
    .orderBy(desc(stationPhotos.is_main), asc(stationPhotos.createdAt));

  return res.send({
    data: rows.map((r) => ({
      id: r.id,
      attachment_uuid: r.attachment_uuid,
      mime_type: r.mime_type,
      is_main: r.is_main,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      author: r.author_uuid && r.author_username && r.author_name ? { uuid: r.author_uuid, username: r.author_username, name: r.author_name } : null,
    })),
  });
}

const getStationPhotos: Route<RequestData, PhotoItem[]> = {
  url: "/stations/:station_id/photos",
  method: "GET",
  schema: schemaRoute,
  config: { permissions: [] },
  handler,
};

export default getStationPhotos;
