import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  response: {
    200: z.object({
      data: z.object({
        bio: z.string().nullable(),
        contactInfo: z
          .object({
            instagram: z.string().optional(),
            facebook: z.string().optional(),
            email: z.string().optional(),
          })
          .nullable(),
        profileVisibility: z.enum(["public", "private"]),
      }),
    }),
  },
};

type ResponseBody = {
  bio: string | null;
  contactInfo: { instagram?: string; facebook?: string; email?: string } | null;
  profileVisibility: string;
};

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
  const userId = session.user.id;

  const user = await db.query.users.findFirst({
    where: { id: userId },
    columns: { bio: true, contactInfo: true, profileVisibility: true },
  });

  if (!user) throw new ErrorResponse("NOT_FOUND");

  return res.send({
    data: {
      bio: user.bio,
      contactInfo: user.contactInfo,
      profileVisibility: user.profileVisibility as "public" | "private",
    },
  });
}

const getAccountProfile: Route<object, ResponseBody> = {
  url: "/account/profile",
  method: "GET",
  config: { allowLoggedIn: true },
  schema: schemaRoute,
  handler,
};

export default getAccountProfile;
