import { operators, stations, users } from "@openbts/drizzle";
import { inArray } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const userSelectSchema = createSelectSchema(users);

const profilePrivateSchema = userSelectSchema
  .pick({ id: true, username: true, name: true, image: true, createdAt: true })
  .extend({ isPrivate: z.literal(true) });

const profilePublicSchema = userSelectSchema
  .pick({ id: true, username: true, name: true, image: true, bio: true, createdAt: true, profileVisibility: true })
  .extend({
    isPrivate: z.literal(false),
    contactInfo: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        email: z.string().optional(),
      })
      .nullable(),

    comments: z.array(
      z.object({
        id: z.string(),
        content: z.string(),
        createdAt: z.date(),
        station: z.object({
          id: z.number(),
          station_id: z.string().nullable(),
          operator: z.object({ id: z.number(), name: z.string(), mnc: z.number().nullable() }).nullable(),
        }),
      }),
    ),
  });

const schemaRoute = {
  params: z.object({ username: z.string() }),
  response: {
    200: z.object({
      data: z.discriminatedUnion("isPrivate", [profilePrivateSchema, profilePublicSchema]),
    }),
  },
};

type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ProfilePrivate = z.infer<typeof profilePrivateSchema>;
type ProfilePublic = z.infer<typeof profilePublicSchema>;
type ProfileData = ProfilePrivate | ProfilePublic;

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ProfileData>>) {
  const { username } = req.params;

  const user = await db.query.users.findFirst({
    where: { username },
    columns: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      contactInfo: true,
      profileVisibility: true,
      createdAt: true,
    },
  });

  if (!user) throw new ErrorResponse("NOT_FOUND");

  if (user.profileVisibility === "private" && req.userSession?.user.id !== user.id) {
    return res.send({
      data: {
        isPrivate: true,
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      },
    });
  }

  const comments = await db.query.stationComments.findMany({
    where: {
      AND: [{ user_id: { eq: user.id } }, { status: { eq: "approved" } }],
    },
    columns: { id: true, content: true, createdAt: true, station_id: true },
    orderBy: { createdAt: "desc" },
    limit: 50,
  });

  const stationIds = [...new Set(comments.map((c) => c.station_id))];
  const stationRows =
    stationIds.length > 0
      ? await db
          .select({ id: stations.id, station_id: stations.station_id, operator_id: stations.operator_id })
          .from(stations)
          .where(inArray(stations.id, stationIds))
      : [];

  const operatorIds = [...new Set(stationRows.map((s) => s.operator_id).filter((id): id is number => id !== null))];
  const operatorRows =
    operatorIds.length > 0
      ? await db.select({ id: operators.id, name: operators.name, mnc: operators.mnc }).from(operators).where(inArray(operators.id, operatorIds))
      : [];

  const operatorMap = new Map(operatorRows.map((o) => [o.id, o]));
  const stationMap = new Map(
    stationRows.map((s) => [
      s.id,
      {
        station_id: s.station_id,
        operator: s.operator_id != null ? (operatorMap.get(s.operator_id) ?? null) : null,
      },
    ]),
  );

  return res.send({
    data: {
      isPrivate: false,
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      contactInfo: user.contactInfo,
      profileVisibility: user.profileVisibility,
      createdAt: user.createdAt,
      comments: comments.map((c) => {
        const station = stationMap.get(c.station_id);
        return {
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          station: {
            id: c.station_id,
            station_id: station?.station_id ?? null,
            operator: station?.operator ?? null,
          },
        };
      }),
    },
  });
}

const getUserProfile = {
  url: "/users/:username",
  method: "GET",
  config: { allowGuestAccess: true },
  schema: schemaRoute,
  handler,
} as unknown as Route<ReqParams, ProfileData>;

export default getUserProfile;
