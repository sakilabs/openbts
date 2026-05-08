import { users } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  body: z.object({
    bio: z.string().max(500).nullable().optional(),
    contactInfo: z
      .object({
        instagram: z.string().max(60).optional(),
        facebook: z.string().max(120).optional(),
        email: z.email().max(100).optional(),
      })
      .nullable()
      .optional(),
    profileVisibility: z.enum(["public", "private"]).optional(),
  }),
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
        profileVisibility: z.string(),
      }),
    }),
  },
};

type ReqBody = { Body: z.infer<typeof schemaRoute.body> };
type ResponseBody = {
  bio: string | null;
  contactInfo: { instagram?: string; facebook?: string; email?: string } | null;
  profileVisibility: string;
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const { bio, contactInfo, profileVisibility } = req.body;

  const patch: Partial<typeof users.$inferInsert> = {};
  if (bio !== undefined) patch.bio = bio;
  if (contactInfo !== undefined) patch.contactInfo = contactInfo;
  if (profileVisibility !== undefined) patch.profileVisibility = profileVisibility;

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, session.user.id))
    .returning({ bio: users.bio, contactInfo: users.contactInfo, profileVisibility: users.profileVisibility });

  if (!updated) throw new ErrorResponse("NOT_FOUND");

  return res.send({ data: updated });
}

const patchAccountProfile: Route<ReqBody, ResponseBody> = {
  url: "/account/profile",
  method: "PATCH",
  config: { allowLoggedIn: true },
  schema: schemaRoute,
  handler,
};

export default patchAccountProfile;
