import { users } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const NO_LINKS_RE = /https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,}/i;

const schemaRoute = {
  body: z.object({
    bio: z
      .string()
      .max(500)
      .refine((v) => !NO_LINKS_RE.test(v), { error: "Bio cannot contain links" })
      .nullable()
      .optional(),
    contactInfo: z
      .object({
        instagram: z
          .string()
          .max(30)
          .refine((v) => !v || /^[a-zA-Z0-9._]{1,30}$/.test(v), { error: "Invalid Instagram handle" })
          .optional(),
        facebook: z
          .string()
          .max(120)
          .refine((v) => !v || /^https:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._%+-]{1,60}\/?$/.test(v), {
            error: "Must be a valid facebook.com URL",
          })
          .optional(),
        email: z.email().max(100).optional(),
      })
      .nullable()
      .optional(),
    profileVisibility: z.enum(["public", "private"]).optional(),
    hunterListing: z.boolean().optional(),
    hunterRegions: z.array(z.number().int().positive()).max(20).optional(),
  }),
  response: {
    200: z.object({
      data: z.object({
        bio: z.string().nullable(),
        contactInfo: z
          .object({
            instagram: z.string().optional(),
            facebook: z.string().optional(),
            email: z.email().optional(),
          })
          .nullable(),
        profileVisibility: z.string(),
        hunterListing: z.boolean(),
        hunterRegions: z.array(z.number().int().positive()),
      }),
    }),
  },
};

type ReqBody = { Body: z.infer<typeof schemaRoute.body> };
type ResponseBody = {
  bio: string | null;
  contactInfo: { instagram?: string; facebook?: string; email?: string } | null;
  profileVisibility: string;
  hunterListing: boolean;
  hunterRegions: number[];
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const { bio, contactInfo, profileVisibility, hunterListing, hunterRegions } = req.body;

  if (hunterRegions !== undefined && hunterRegions.length > 0) {
    const valid = await db.query.regions.findMany({ columns: { id: true } });
    const validIds = new Set(valid.map((r) => r.id));
    if (!hunterRegions.every((id) => validIds.has(id))) throw new ErrorResponse("BAD_REQUEST", { message: "Invalid region IDs" });
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (bio !== undefined) patch.bio = bio;
  if (contactInfo !== undefined) patch.contactInfo = contactInfo;
  if (profileVisibility !== undefined) patch.profileVisibility = profileVisibility;
  if (hunterListing !== undefined) patch.hunterListing = hunterListing;
  if (hunterRegions !== undefined) patch.hunterRegions = hunterRegions;

  const [updated] = await db.update(users).set(patch).where(eq(users.id, session.user.id)).returning({
    bio: users.bio,
    contactInfo: users.contactInfo,
    profileVisibility: users.profileVisibility,
    hunterListing: users.hunterListing,
    hunterRegions: users.hunterRegions,
  });

  if (!updated) throw new ErrorResponse("NOT_FOUND");

  return res.send({ data: { ...updated, hunterRegions: updated.hunterRegions ?? [] } });
}

const patchAccountProfile: Route<ReqBody, ResponseBody> = {
  url: "/account/profile",
  method: "PATCH",
  schema: schemaRoute,
  handler,
};

export default patchAccountProfile;
