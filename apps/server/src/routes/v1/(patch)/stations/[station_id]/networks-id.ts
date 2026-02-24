import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { networksIds } from "@openbts/drizzle";
import { createAuditLog } from "../../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const networksIdsSelectSchema = createSelectSchema(networksIds);

const requestSchema = z.object({
  networks_id: z.int(),
  networks_name: z.string().max(50).nullable().optional(),
  mno_name: z.string().max(50).nullable().optional(),
});

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  body: requestSchema,
  response: {
    200: z.object({
      data: networksIdsSelectSchema,
    }),
  },
};

type ReqBody = { Body: z.infer<typeof requestSchema> };
type ReqParams = { Params: { station_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof networksIdsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { station_id } = req.params;
  const { networks_id, networks_name, mno_name } = req.body;

  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const existing = await db.query.networksIds.findFirst({
    where: {
      AND: [{ station_id: station_id }, { networks_id: networks_id }],
    },
  });

  const [result] = await db
    .insert(networksIds)
    .values({
      station_id,
      networks_id,
      networks_name: networks_name ?? null,
      mno_name: mno_name ?? null,
    })
    .onConflictDoUpdate({
      target: [networksIds.station_id, networksIds.networks_id],
      set: {
        networks_name: networks_name ?? null,
        mno_name: mno_name ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!result) throw new ErrorResponse("FAILED_TO_UPDATE");

  await createAuditLog(
    {
      action: "stations.update",
      table_name: "networks_ids",
      record_id: station_id,
      old_values: existing ?? null,
      new_values: result,
    },
    req,
  );

  return res.send({ data: result });
}

const updateStationNetworksId: Route<RequestData, ResponseData> = {
  url: "/stations/:station_id/networks-id",
  method: "PATCH",
  config: { permissions: ["write:stations"] },
  schema: schemaRoute,
  handler,
};

export default updateStationNetworksId;
