import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { extraIdentificators, stations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import { createAuditLog } from "../../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const extraIdentificatorsSelectSchema = createSelectSchema(extraIdentificators);

const requestSchema = z.object({
  networks_id: z.int().nullable().optional(),
  networks_name: z.string().max(150).nullable().optional(),
  mno_name: z.string().max(50).nullable().optional(),
});

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  body: requestSchema,
  response: {
    200: z.object({
      data: extraIdentificatorsSelectSchema,
    }),
  },
};

type ReqBody = { Body: z.infer<typeof requestSchema> };
type ReqParams = { Params: { station_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof extraIdentificatorsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { station_id } = req.params;
  const { networks_id, networks_name, mno_name } = req.body;

  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const EXTRA_IDENTIFICATORS_MNCS = new Set([26002, 26003]); // T-Mobile, Orange
  const MNO_NAME_ONLY_MNCS = new Set([26001]); // Plus

  if (station.operator_id) {
    const operator = await db.query.operators.findFirst({ where: { id: station.operator_id } });
    const mnc = operator?.mnc ?? null;

    if (mnc !== null && MNO_NAME_ONLY_MNCS.has(mnc) && (networks_id || networks_name))
      throw new ErrorResponse("BAD_REQUEST", { message: "This operator only supports mno_name" });

    if (mnc !== null && !EXTRA_IDENTIFICATORS_MNCS.has(mnc) && !MNO_NAME_ONLY_MNCS.has(mnc)) {
      throw new ErrorResponse("BAD_REQUEST", { message: "This operator does not support extra identifiers" });
    }
  }

  const existing = await db.query.extraIdentificators.findFirst({
    where: {
      station_id: station_id,
    },
  });

  const allEmpty = !networks_id && !networks_name && !mno_name;

  if (allEmpty && existing) {
    await db.delete(extraIdentificators).where(eq(extraIdentificators.id, existing.id));
    await db.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, station_id));

    await createAuditLog(
      {
        action: "stations.update",
        table_name: "extra_identificators",
        record_id: station_id,
        old_values: existing,
        new_values: null,
      },
      req,
    );

    return res.send({ data: existing });
  }

  if (allEmpty) {
    return res.send({ data: existing ?? ({} as ResponseData) });
  }

  const [result] = await db
    .insert(extraIdentificators)
    .values({
      station_id,
      networks_id: networks_id ?? null,
      networks_name: networks_name ?? null,
      mno_name: mno_name ?? null,
    })
    .onConflictDoUpdate({
      target: [extraIdentificators.station_id, extraIdentificators.networks_id],
      set: {
        networks_name: networks_name ?? null,
        mno_name: mno_name ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!result) throw new ErrorResponse("FAILED_TO_UPDATE");

  await db.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, station_id));

  await createAuditLog(
    {
      action: "stations.update",
      table_name: "extra_identificators",
      record_id: station_id,
      old_values: existing ?? null,
      new_values: result,
    },
    req,
  );

  return res.send({ data: result });
}

const updateStationExtraIdentificators: Route<RequestData, ResponseData> = {
  url: "/stations/:station_id/extra-identifiers",
  method: "PATCH",
  config: { permissions: ["write:stations"] },
  schema: schemaRoute,
  handler,
};

export default updateStationExtraIdentificators;
