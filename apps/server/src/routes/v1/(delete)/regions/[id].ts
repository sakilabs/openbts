import { eq } from "drizzle-orm";
import { regions } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({
    id: z.coerce.number<number>(),
  }),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<EmptyResponse>) {
  const { id } = req.params;

  const region = await db.query.regions.findFirst({
    where: {
      id: id,
    },
  });
  if (!region) throw new ErrorResponse("NOT_FOUND");

  try {
    await db.delete(regions).where(eq(regions.id, id));
  } catch {
    throw new ErrorResponse("FAILED_TO_DELETE");
  }

  return res.status(204).send();
}

const deleteRegion: Route<IdParams, void> = {
  url: "/regions/:id",
  method: "DELETE",
  config: { permissions: ["delete:regions"] },
  schema: schemaRoute,
  handler,
};

export default deleteRegion;
