import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const contactInfoSchema = z
  .object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    email: z.string().optional(),
  })
  .nullable();

const hunterSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  image: z.string().nullable(),
  regions: z.array(z.number().int()),
  contactInfo: contactInfoSchema,
});

const schemaRoute = {
  response: {
    200: z.object({
      data: z.array(hunterSchema),
    }),
  },
};

type Hunter = z.infer<typeof hunterSchema>;

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<Hunter[]>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hunters = await db.query.users.findMany({
    where: {
      hunterListing: true,
      profileVisibility: "public",
    },
    columns: {
      id: true,
      name: true,
      username: true,
      image: true,
      hunterRegions: true,
      contactInfo: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return res.send({
    data: hunters.map((hunter) => ({
      id: hunter.id,
      name: hunter.name,
      username: hunter.username,
      image: hunter.image,
      regions: hunter.hunterRegions ?? [],
      contactInfo: hunter.contactInfo ?? null,
    })),
  });
}

const getHunters: Route<object, Hunter[]> = {
  url: "/hunters",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getHunters;
