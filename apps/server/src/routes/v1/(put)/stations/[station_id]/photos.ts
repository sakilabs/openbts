import { z } from "zod/v4";
import { eq, inArray, and } from "drizzle-orm";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { verifyPermissions } from "../../../../../plugins/auth/utils.js";
import { stationPhotoSelections, locationPhotos } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({ station_id: z.coerce.number() }),
  body: z.object({
    selected: z.array(z.number()).max(50),
    main_id: z.number().nullable().optional(),
  }),
  response: {
    200: z.object({ data: z.object({ updated: z.number() }) }),
  },
};

type ReqParams = { Params: { station_id: number } };
type ReqBody = { Body: { selected: number[]; main_id?: number | null } };
type RequestData = ReqParams & ReqBody;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<{ updated: number }>>) {
  const { station_id } = req.params;
  const { selected, main_id } = req.body;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { stations: ["update"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  if (selected.length > 0) {
    // Verify all selected location_photo_ids belong to this station's location
    const validPhotos = await db
      .select({ id: locationPhotos.id })
      .from(locationPhotos)
      .where(and(inArray(locationPhotos.id, selected), eq(locationPhotos.location_id, station.location_id!)));

    if (validPhotos.length !== selected.length) {
      throw new ErrorResponse("BAD_REQUEST", { message: "Some photos do not belong to this station's location" });
    }

    // Ensure main_id is within the selected set
    const mainId = main_id != null && selected.includes(main_id) ? main_id : null;

    await db.transaction(async (tx) => {
      await tx.delete(stationPhotoSelections).where(eq(stationPhotoSelections.station_id, station_id));
      await tx.insert(stationPhotoSelections).values(
        selected.map((location_photo_id) => ({
          station_id,
          location_photo_id,
          is_main: location_photo_id === mainId,
        })),
      );
    });
  } else {
    await db.delete(stationPhotoSelections).where(eq(stationPhotoSelections.station_id, station_id));
  }

  return res.send({ data: { updated: selected.length } });
}

const putStationPhotos: Route<RequestData, { updated: number }> = {
  url: "/stations/:station_id/photos",
  method: "PUT",
  schema: schemaRoute,
  config: { permissions: ["update:stations"] },
  handler,
};

export default putStationPhotos;
