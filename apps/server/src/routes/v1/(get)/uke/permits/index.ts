import { and, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import { bands, operators, ukePermits, ukeLocations } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const ukePermitsSchema = createSelectSchema(ukePermits).omit({ band_id: true, operator_id: true, location_id: true });
const ukeLocationsSchema = createSelectSchema(ukeLocations).omit({ point: true });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators);
const schemaRoute = {
  querystring: z.object({
    bounds: z
      .string()
      .regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
      .optional()
      .transform((val): number[] | undefined => (val ? val.split(",").map(Number) : undefined)),
    limit: z.coerce.number().min(1).optional().default(150),
    page: z.coerce.number().min(1).default(1),
    rat: z
      .string()
      .regex(/^(?:cdma|umts|gsm|gsm-r|lte|5g|iot)(?:,(?:cdma|umts|gsm|gsm-r|lte|5g|iot))*$/i)
      .optional()
      .transform((val): string[] | undefined => (val ? val.toLowerCase().split(",").filter(Boolean) : undefined)),
    operators: z
      .string()
      .regex(/^\d+(,\d+)*$/)
      .optional()
      .transform((val): number[] | undefined =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
    bands: z
      .string()
      .regex(/^\d+(,\d+)*$/)
      .optional()
      .transform((val): number[] | undefined =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
    decisionType: z.literal(["zmP", "P"]).optional(),
    decision_number: z.string().optional(),
    station_id: z.string().optional(),
  }),
  response: {
    200: z.object({
      data: z.array(
        ukePermitsSchema.extend({
          band: bandsSchema,
          operator: operatorsSchema,
          location: ukeLocationsSchema,
        }),
      ),
    }),
  },
};
type ReqQuery = {
  Querystring: z.infer<typeof schemaRoute.querystring>;
};
type Permit = z.infer<typeof ukePermitsSchema> & {
  band?: z.infer<typeof bandsSchema>;
  operator?: z.infer<typeof operatorsSchema>;
  location?: z.infer<typeof ukeLocationsSchema>;
};

const SIMILARITY_THRESHOLD = 0.6;

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<Permit[]>>) {
  const { limit = undefined, page = 1, bounds, rat, bands: bandValues, decisionType, decision_number, station_id } = req.query;
  const offset = limit ? (page - 1) * limit : undefined;

  let bandIds: number[] | undefined;
  if (bandValues) {
    const validBands = await db.query.bands.findMany({
      columns: { id: true },
      where: { value: { in: bandValues } },
    });

    bandIds = validBands.map((band) => band.id);
    if (bandIds.length === 0) return res.send({ data: [] });
  }

  try {
    let envelope: ReturnType<typeof sql> | undefined;
    if (bounds) {
      const [la1, lo1, la2, lo2] = bounds as [number, number, number, number];
      const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
      const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];
      envelope = sql`ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)`;
    }

    let locationIds: number[] | undefined;
    if (envelope) {
      const boundaryLocations = await db
        .select({ id: ukeLocations.id })
        .from(ukeLocations)
        .where(sql`ST_Intersects(${ukeLocations.point}, ${envelope})`);

      locationIds = boundaryLocations.map((loc) => loc.id);
      if (!locationIds.length) return res.send({ data: [] });
    }

    const ukePermitsRes = await db.query.ukePermits.findMany({
      columns: {
        band_id: false,
        location_id: false,
        operator_id: false,
      },
      with: {
        band: true,
        operator: true,
        location: {
          columns: {
            point: false,
          },
        },
      },
      where: {
        RAW: (fields) => {
          const conditions: (SQL<unknown> | undefined)[] = [];
          if (bandIds && bandIds.length > 0) conditions.push(inArray(fields.band_id, bandIds));
          if (locationIds) conditions.push(inArray(fields.location_id, locationIds));
          if (decisionType) conditions.push(eq(fields.decision_type, decisionType));
          if (decision_number) {
            const like = `%${decision_number}%`;
            conditions.push(
              or(ilike(fields.decision_number, like), sql`similarity(${fields.decision_number}, ${decision_number}) > ${SIMILARITY_THRESHOLD}`),
            );
          }
          if (station_id) {
            const like = `%${station_id}%`;
            conditions.push(or(ilike(fields.station_id, like), sql`similarity(${fields.station_id}, ${station_id}) > ${SIMILARITY_THRESHOLD}`));
          }
          return conditions.length > 0 ? (and(...conditions) ?? sql`true`) : sql`true`;
        },
      },
      limit,
      offset: offset,
    });

    let data = ukePermitsRes;
    if (rat) {
      const ratMap: Record<string, string> = {
        gsm: "gsm",
        "gsm-r": "gsm-r",
        umts: "umts",
        lte: "lte",
        "5g": "nr",
        cdma: "cdma",
        iot: "iot",
      } as const;
      const allowedRats = rat.map((t) => ratMap[t]).filter((t): t is string => t !== undefined);
      const wantsGsmR = allowedRats.includes("gsm-r");
      const wantsGsm = allowedRats.includes("gsm");
      const otherRats = allowedRats.filter((r) => r !== "gsm" && r !== "gsm-r");

      data = data.filter((permit) => {
        if (!permit.band?.rat) return false;
        const bandRat = permit.band.rat.toLowerCase();
        const isRailway = permit.band.variant === "railway";

        if (bandRat === "gsm") {
          if (isRailway) return wantsGsmR;
          return wantsGsm;
        }
        return otherRats.includes(bandRat);
      });
    }

    res.send({ data });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const getUkePermits: Route<ReqQuery, Permit[]> = {
  url: "/uke/permits",
  method: "GET",
  schema: schemaRoute,
  config: { permissions: ["read:uke_permits"], allowGuestAccess: true },
  handler,
};

export default getUkePermits;
