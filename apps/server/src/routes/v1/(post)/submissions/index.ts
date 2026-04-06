import {
  submissions,
  proposedCells,
  proposedStations,
  proposedLocations,
  submissionLocationPhotoSelections,
  locationPhotos,
  stations,
} from "@openbts/drizzle";
import { inArray, eq, and, count } from "drizzle-orm";
import { isARFCNValidForBand } from "@openbts/shared/frequency";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import { checkCellDuplicatesBatch } from "../../../../services/cellDuplicateCheck.service.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";
import { notifyStaffNewSubmission } from "../../../../services/notification.service.js";
import {
  gsmInsertSchema,
  umtsInsertSchema,
  lteInsertSchema,
  nrInsertSchemaBase,
  isNonEmpty,
  validateCellDuplicates,
  insertProposedCellDetails,
  makeDetailsRatRefine,
} from "../../../../utils/submission.helpers.js";
import { logger } from "../../../../utils/logger.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const submissionsInsertBase = createInsertSchema(submissions).omit({ createdAt: true, updatedAt: true, submitter_id: true });
const proposedStationInsert = createInsertSchema(proposedStations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const proposedLocationInsert = createInsertSchema(proposedLocations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const nrInsertSchema = nrInsertSchemaBase.superRefine((data, ctx) => {
  if (data.type === "nsa") {
    for (const field of ["nrtac", "clid", "gnbid", "arfcn"] as const) {
      if (data[field] !== null && data[field] !== undefined)
        ctx.addIssue({ code: "custom", message: `${field} must not be set for NSA NR cells`, path: [field] });
    }
    if (data.supports_nr_redcap === true) {
      ctx.addIssue({ code: "custom", message: "supports_nr_redcap must not be set for NSA NR cells", path: ["supports_nr_redcap"] });
    }
  }
});
const proposedCellInsert = createInsertSchema(proposedCells)
  .omit({ createdAt: true, updatedAt: true, submission_id: true, is_confirmed: true, operation: true })
  .extend({
    operation: z.enum(["add", "update", "delete"]).optional(),
    details: z.unknown().optional(),
  })
  .strict()
  .superRefine(makeDetailsRatRefine({ GSM: gsmInsertSchema, UMTS: umtsInsertSchema, LTE: lteInsertSchema, NR: nrInsertSchema }));

const singleSubmissionSchema = z
  .object({
    station_id: submissionsInsertBase.shape.station_id.optional(),
    type: submissionsInsertBase.shape.type.optional(),
    submitter_note: z.string().optional(),
    station: proposedStationInsert.optional(),
    location: proposedLocationInsert.optional(),
    cells: z.array(proposedCellInsert).optional(),
    pending_photos: z.number().int().min(1).optional(),
    location_photo_ids: z.array(z.number().int()).max(50).optional(),
  })
  .strict();

type SingleSubmission = z.infer<typeof singleSubmissionSchema>;

const requestSchema = z.union([singleSubmissionSchema, z.array(singleSubmissionSchema).min(1).max(10)]);

type ReqBody = { Body: z.infer<typeof requestSchema> };
const schemaRoute = {
  body: requestSchema,
  response: {
    200: z.object({
      data: z.array(
        submissionsSelectSchema.extend({
          proposedStation: proposedStationInsert.optional(),
          proposedLocation: proposedLocationInsert.optional(),
          cells: z.array(proposedCellInsert).optional(),
        }),
      ),
    }),
  },
};

type ResponseData = z.infer<typeof submissionsSelectSchema>[];

type SubmissionWithExtras = z.infer<typeof submissionsSelectSchema> & {
  proposedStation?: z.infer<typeof proposedStationInsert>;
  proposedLocation?: z.infer<typeof proposedLocationInsert>;
  cells?: z.infer<typeof proposedCellInsert>[];
};

function hasMeaningfulChanges(input: SingleSubmission): boolean {
  if (input.type === "delete") return true;
  const { station_id: _, type: __, ...payload } = input;
  return isNonEmpty(payload);
}

async function validateSubmission(input: SingleSubmission): Promise<void> {
  const { station_id, type, station: stationData, location: locationData } = input;

  if ((type === "update" || type === "delete") && !station_id)
    throw new ErrorResponse("INVALID_QUERY", { message: "station_id is required for update and delete submissions" });

  const stationId = station_id !== undefined ? Number(station_id) : null;
  if (stationId !== null && Number.isNaN(stationId)) throw new ErrorResponse("INVALID_QUERY");

  const [targetStation, duplicateStation, existingLocation] = await Promise.all([
    stationId !== null
      ? db.query.stations.findFirst({
          where: { id: stationId },
          with: { location: true },
        })
      : null,

    type === "new" && stationData?.station_id
      ? db.query.stations.findFirst({
          where: {
            station_id: stationData.station_id,
            operator_id: stationData.operator_id,
          },
        })
      : null,

    type === "new" && stationData?.station_id && locationData?.latitude !== undefined && locationData?.longitude !== undefined
      ? db.query.locations.findFirst({
          with: {
            stations: {
              where: {
                station_id: stationData.station_id,
              },
            },
          },
          where: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          },
        })
      : null,
  ]);

  if (stationId !== null && !targetStation) throw new ErrorResponse("NOT_FOUND", { message: "Station not found for the provided station_id" });

  if (duplicateStation)
    throw new ErrorResponse("BAD_REQUEST", {
      message: "A station with the provided station_id and operator already exists. Use `existing` mode",
    });

  if (type === "new" && existingLocation && existingLocation.stations && existingLocation.stations.length > 0)
    throw new ErrorResponse("BAD_REQUEST", { message: "The station is already registered at this location" });

  if (input.cells && input.cells.length > 0) validateCellDuplicates(input.cells);

  if (input.cells && input.cells.length > 0) {
    const bandIds = [...new Set(input.cells.filter((c) => c.band_id !== null && c.band_id !== undefined).map((c) => c.band_id!))];
    if (bandIds.length > 0) {
      const bandRows = await db.query.bands.findMany({ where: { id: { in: bandIds } }, columns: { id: true, rat: true, value: true, duplex: true } });
      const bandMap = new Map(bandRows.map((b) => [b.id, b]));
      for (const cell of input.cells) {
        if (cell.operation === "delete" || !cell.band_id || !cell.rat || !cell.details) continue;
        const band = bandMap.get(cell.band_id);
        if (!band?.value) continue;
        const details = cell.details as Record<string, unknown>;
        const arfcn = (details["earfcn"] ?? details["arfcn"]) as number | null | undefined;
        if (arfcn === null || arfcn === undefined) continue;
        if (!isARFCNValidForBand(cell.rat, band.value, arfcn, band.duplex))
          throw new ErrorResponse("BAD_REQUEST", { message: `ARFCN ${arfcn} is not valid for band ${band.value} (${cell.rat})` });
      }
    }
  }

  if (type === "update" && input.location_photo_ids && input.location_photo_ids.length > 0) {
    if (!targetStation?.location?.id)
      throw new ErrorResponse("BAD_REQUEST", { message: "Cannot validate location_photo_ids: station has no location" });
    const [countRow] = await db
      .select({ value: count() })
      .from(locationPhotos)
      .where(and(inArray(locationPhotos.id, input.location_photo_ids), eq(locationPhotos.location_id, targetStation.location.id)));
    if ((countRow?.value ?? 0) !== input.location_photo_ids.length)
      throw new ErrorResponse("BAD_REQUEST", { message: "One or more location_photo_ids are invalid or do not belong to this station's location" });
  }

  const operatorId = type === "new" ? stationData?.operator_id : targetStation?.operator_id;
  if (operatorId && input.cells && input.cells.length > 0) {
    const dupEntries = input.cells
      .filter((cell) => cell.details && cell.operation !== "delete")
      .map((cell) => ({ rat: cell.rat!, details: cell.details as Record<string, unknown>, excludeCellId: cell.target_cell_id ?? undefined }));
    if (dupEntries.length > 0) await checkCellDuplicatesBatch(dupEntries, operatorId);
  }

  if (type === "update" && targetStation) {
    const hasStationChanges =
      stationData &&
      (stationData.station_id !== targetStation.station_id ||
        stationData.operator_id !== targetStation.operator_id ||
        (stationData.notes ?? null) !== (targetStation.notes ?? null) ||
        stationData.networks_id !== undefined ||
        stationData.mno_name !== undefined);

    const currentLocation = targetStation.location;
    const hasLocationChanges =
      locationData &&
      currentLocation &&
      (locationData.latitude !== currentLocation.latitude ||
        locationData.longitude !== currentLocation.longitude ||
        locationData.region_id !== currentLocation.region_id ||
        (locationData.city ?? null) !== (currentLocation.city ?? null) ||
        (locationData.address ?? null) !== (currentLocation.address ?? null));

    const hasCellChanges = input.cells && input.cells.length > 0;

    const hasPendingPhotos = !!input.pending_photos;
    const hasLocationPhotoSelections = (input.location_photo_ids?.length ?? 0) > 0;
    if (!hasStationChanges && !hasLocationChanges && !hasCellChanges && !hasPendingPhotos && !hasLocationPhotoSelections)
      throw new ErrorResponse("BAD_REQUEST", { message: "No changes detected. Please modify the data before submitting." });
  }
}

async function processSubmission(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: SingleSubmission,
  userId: string,
): Promise<SubmissionWithExtras> {
  const { station_id, type, submitter_note, station: stationData, location: locationData, cells: proposedCellsInput } = input;

  if (!hasMeaningfulChanges(input))
    throw new ErrorResponse("BAD_REQUEST", { message: "No changes detected. Please modify the data before submitting." });

  const [submission] = await tx
    .insert(submissions)
    .values({
      submitter_id: userId,
      station_id: station_id ?? null,
      type,
      submitter_note: submitter_note ?? null,
      pending_photos: input.pending_photos ?? null,
    })
    .returning();
  if (!submission) throw new ErrorResponse("FAILED_TO_CREATE");

  if (stationData)
    await tx.insert(proposedStations).values({
      ...stationData,
      notes: typeof stationData.notes === "string" && stationData.notes.trim() !== "" ? stationData.notes : null,
      submission_id: submission.id,
      is_confirmed: false,
    });

  if (locationData) await tx.insert(proposedLocations).values({ ...locationData, submission_id: submission.id });

  if (input.location_photo_ids && input.location_photo_ids.length > 0) {
    await tx
      .insert(submissionLocationPhotoSelections)
      .values(input.location_photo_ids.map((photoId) => ({ submission_id: submission.id, location_photo_id: photoId })));
  }

  if (proposedCellsInput && proposedCellsInput.length > 0) {
    /* eslint-disable no-await-in-loop */
    for (const cell of proposedCellsInput) {
      try {
        const [base] = await tx
          .insert(proposedCells)
          .values({
            submission_id: submission.id,
            target_cell_id: cell.target_cell_id ?? null,
            station_id: cell.station_id ?? station_id ?? null,
            band_id: cell.band_id ?? null,
            rat: cell.rat ?? null,
            notes: cell.notes ?? null,
            is_confirmed: false,
            operation: cell.operation ?? "add",
          })
          .returning();
        if (!base) throw new ErrorResponse("FAILED_TO_CREATE");

        if (cell.operation !== "delete") {
          await insertProposedCellDetails(tx, cell.rat, cell.details as Record<string, unknown>, base.id);
        }
      } catch (error) {
        if (error instanceof ErrorResponse) throw error;
        throw new ErrorResponse("FAILED_TO_CREATE", {
          message: `Failed to create proposed ${String(cell.rat ?? "unknown")} cell: ${error instanceof Error ? error.message : "Unknown error"}`,
          cause: error,
        });
      }
    }
    /* eslint-enable no-await-in-loop */
  }

  return { ...submission, proposedStation: stationData, proposedLocation: locationData, cells: proposedCellsInput };
}

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
  const userSession = req.userSession;
  if (!userSession?.user?.id) throw new ErrorResponse("UNAUTHORIZED");
  const userId = userSession.user.id;
  if (Number.isNaN(userId)) throw new ErrorResponse("UNAUTHORIZED");

  const submissionInputs: SingleSubmission[] = Array.isArray(req.body) ? req.body : [req.body];

  await Promise.all(submissionInputs.map(validateSubmission));

  try {
    const results = await db.transaction(async (tx) => {
      const created: SubmissionWithExtras[] = [];
      for (const input of submissionInputs) {
        // eslint-disable-next-line no-await-in-loop
        created.push(await processSubmission(tx, input, userId));
      }
      return created;
    });

    await Promise.all(
      results.map((submission) =>
        createAuditLog(
          {
            action: "submissions.create",
            table_name: "submissions",
            record_id: undefined,
            old_values: null,
            new_values: submission,
            metadata: { submission_id: submission.id },
          },
          req,
        ),
      ),
    );

    const submitterName = userSession.user.name || userSession.user.username || "Unknown";

    const stationIdsToResolve = results.filter((s) => !s.proposedStation?.station_id && s.station_id).map((s) => s.station_id!);

    const uniqueStationIds = Array.from(new Set(stationIdsToResolve));
    const resolvedStations =
      uniqueStationIds.length > 0
        ? await db.select({ id: stations.id, station_id: stations.station_id }).from(stations).where(inArray(stations.id, uniqueStationIds))
        : [];

    const stationIdMap = new Map(resolvedStations.map((s) => [s.id, s.station_id]));

    for (const submission of results) {
      if (
        submission.pending_photos &&
        !submission.proposedStation &&
        !submission.proposedLocation &&
        (!submission.cells || submission.cells.length === 0) &&
        !submission.submitter_note
      )
        continue;

      const stationStringId = submission.proposedStation?.station_id ?? (submission.station_id ? stationIdMap.get(submission.station_id) : undefined);

      void notifyStaffNewSubmission({
        submissionId: submission.id,
        submitterName,
        submissionType: submission.type ?? "new",
        stationId: stationStringId ?? undefined,
      }).catch((e) => logger.error("Failed to notify staff about new submission", { error: e }));
    }

    return res.send({ data: results });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", { message: error instanceof Error ? error.message : "Unknown error", cause: error });
  }
}

const createSubmission: Route<ReqBody, ResponseData> = {
  url: "/submissions",
  method: "POST",
  config: { permissions: ["write:submissions"] },
  schema: schemaRoute,
  handler,
};

export default createSubmission;
