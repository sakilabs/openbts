import {
  submissions,
  proposedCells,
  proposedGSMCells,
  proposedUMTSCells,
  proposedLTECells,
  proposedNRCells,
  proposedStations,
  proposedLocations,
} from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import { checkGSMDuplicate, checkLTEDuplicate, checkUMTSDuplicate } from "../../../../services/cellDuplicateCheck.service.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const submissionsInsertBase = createInsertSchema(submissions).omit({ createdAt: true, updatedAt: true, submitter_id: true });
const proposedStationInsert = createInsertSchema(proposedStations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const proposedLocationInsert = createInsertSchema(proposedLocations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const gsmInsertSchema = createInsertSchema(proposedGSMCells).omit({ proposed_cell_id: true }).strict();
const umtsInsertSchema = createInsertSchema(proposedUMTSCells).omit({ proposed_cell_id: true }).strict();
const lteInsertSchema = createInsertSchema(proposedLTECells).omit({ proposed_cell_id: true }).strict();
const nrInsertSchema = createInsertSchema(proposedNRCells).omit({ proposed_cell_id: true }).strict();
const proposedCellInsert = createInsertSchema(proposedCells)
  .omit({ createdAt: true, updatedAt: true, submission_id: true, is_confirmed: true, operation: true })
  .extend({
    operation: z.enum(["added", "updated", "removed"]).optional(),
    details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]).optional(),
  })
  .strict();

const singleSubmissionSchema = z
  .object({
    station_id: submissionsInsertBase.shape.station_id.optional(),
    type: submissionsInsertBase.shape.type.optional(),
    submitter_note: z.string().optional(),
    station: proposedStationInsert.optional(),
    location: proposedLocationInsert.optional(),
    cells: z.array(proposedCellInsert).optional(),
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

function mapCellOperation(op: string): "add" | "update" | "delete" {
  switch (op) {
    case "updated":
      return "update";
    case "removed":
      return "delete";
    default:
      return "add";
  }
}

function isNonEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(isNonEmpty);
  if (typeof value === "object") return Object.values(value as object).some(isNonEmpty);
  return false;
}

function hasMeaningfulChanges(input: SingleSubmission): boolean {
  if (input.type === "delete") return true;
  const { station_id: _, type: __, ...payload } = input;
  return isNonEmpty(payload);
}

function validateCellDuplicates(cells: NonNullable<SingleSubmission["cells"]>): void {
  for (const rat of ["GSM", "UMTS"] as const) {
    const ratCells = cells.filter((c) => c.rat === rat && c.operation !== "removed");
    const seen = new Set<number>();
    for (const cell of ratCells) {
      const cid = (cell.details as { cid?: number } | undefined)?.cid;
      if (cid === undefined) continue;
      if (seen.has(cid)) throw new ErrorResponse("BAD_REQUEST", { message: `Duplicate CID ${cid} found in ${rat} cells` });
      seen.add(cid);
    }
  }

  const lteCells = cells.filter((c) => c.rat === "LTE" && c.operation !== "removed");
  const seen = new Set<string>();
  for (const cell of lteCells) {
    const d = cell.details as { enbid?: number; clid?: number } | undefined;
    if (d?.enbid === undefined || d?.clid === undefined) continue;
    const key = `${d.enbid}:${d.clid}`;
    if (seen.has(key)) throw new ErrorResponse("BAD_REQUEST", { message: `Duplicate eNBID+CLID (${d.enbid}+${d.clid}) found in LTE cells` });
    seen.add(key);
  }
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

  const operatorId = type === "new" ? stationData?.operator_id : targetStation?.operator_id;
  if (operatorId && input.cells && input.cells.length > 0) {
    for (const cell of input.cells) {
      if (!cell.details || cell.operation === "removed") continue;
      if (cell.rat === "GSM") {
        const d = cell.details as { lac: number; cid: number };
        /* eslint-disable-next-line no-await-in-loop */
        await checkGSMDuplicate(d.lac, d.cid, operatorId);
      } else if (cell.rat === "UMTS") {
        const d = cell.details as { rnc: number; cid: number };
        /* eslint-disable-next-line no-await-in-loop */
        await checkUMTSDuplicate(d.rnc, d.cid, operatorId);
      } else if (cell.rat === "LTE") {
        const d = cell.details as { enbid: number; clid: number };
        /* eslint-disable-next-line no-await-in-loop */
        await checkLTEDuplicate(d.enbid, d.clid, operatorId);
      }
    }
  }

  if (type === "update" && targetStation) {
    const hasStationChanges =
      stationData &&
      (stationData.station_id !== targetStation.station_id ||
        stationData.operator_id !== targetStation.operator_id ||
        (stationData.notes ?? null) !== (targetStation.notes ?? null));

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

    if (!hasStationChanges && !hasLocationChanges && !hasCellChanges)
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
    .values({ submitter_id: userId, station_id: station_id ?? null, type, submitter_note: submitter_note ?? null })
    .returning();
  if (!submission) throw new ErrorResponse("FAILED_TO_CREATE");

  if (stationData) await tx.insert(proposedStations).values({ ...stationData, submission_id: submission.id, status: "pending", is_confirmed: false });

  if (locationData) await tx.insert(proposedLocations).values({ ...locationData, submission_id: submission.id });

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
            operation: mapCellOperation(cell.operation ?? "added"),
          })
          .returning();
        if (!base) throw new ErrorResponse("FAILED_TO_CREATE");

        if (cell.operation !== "removed") {
          switch (cell.rat) {
            case "GSM": {
              const details = cell.details as z.infer<typeof gsmInsertSchema>;
              await tx.insert(proposedGSMCells).values({ ...details, proposed_cell_id: base.id });
              break;
            }
            case "UMTS": {
              const details = cell.details as z.infer<typeof umtsInsertSchema>;
              await tx.insert(proposedUMTSCells).values({ ...details, proposed_cell_id: base.id });
              break;
            }
            case "LTE": {
              const details = cell.details as z.infer<typeof lteInsertSchema>;
              await tx.insert(proposedLTECells).values({ ...details, proposed_cell_id: base.id });
              break;
            }
            case "NR": {
              const details = cell.details as z.infer<typeof nrInsertSchema>;
              await tx
                .insert(proposedNRCells)
                .values({ ...details, proposed_cell_id: base.id, gnbid_length: details.gnbid ? details.gnbid.toString(2).length : undefined });
              break;
            }
          }
        }
      } catch (error) {
        if (error instanceof ErrorResponse) throw error;
        throw new ErrorResponse("FAILED_TO_CREATE", {
          message: `Failed to create proposed ${cell.rat ?? "unknown"} cell: ${error instanceof Error ? error.message : "Unknown error"}`,
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
