import { eq } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { createAuditLog } from "../../../../../services/auditLog.service.js";
import { checkCellDuplicatesBatch, getOperatorIdForStation } from "../../../../../services/cellDuplicateCheck.service.js";
import { getRuntimeSettings } from "../../../../../services/settings.service.js";
import { verifyPermissions } from "../../../../../plugins/auth/utils.js";
import {
  gsmInsertSchema,
  umtsInsertSchema,
  lteInsertSchema,
  nrInsertSchemaBase,
  detailsSelectSchema,
  proposedCellsSelectSchema,
  isNonEmpty,
  validateCellDuplicates,
  insertProposedCellDetails,
  makeDetailsRatRefine,
} from "../../../../../utils/submission.helpers.js";
import { submissions, proposedCells, proposedStations, proposedLocations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const cellInputSchema = createInsertSchema(proposedCells)
  .omit({ createdAt: true, updatedAt: true, submission_id: true })
  .extend({
    operation: z.enum(["add", "update", "delete"]).optional(),
    details: z.unknown().optional(),
  })
  .superRefine(makeDetailsRatRefine({ GSM: gsmInsertSchema, UMTS: umtsInsertSchema, LTE: lteInsertSchema, NR: nrInsertSchemaBase }));

const stationInputSchema = createInsertSchema(proposedStations).omit({ createdAt: true, updatedAt: true, submission_id: true }).partial();

const locationInputSchema = createInsertSchema(proposedLocations).omit({ createdAt: true, updatedAt: true, submission_id: true }).partial();

const requestSchema = z.object({
  review_notes: z.string().nullable().optional(),
  submitter_note: z.string().optional(),
  station: stationInputSchema.optional(),
  location: locationInputSchema.optional(),
  cells: z.array(cellInputSchema).optional(),
});

const responseSchema = submissionsSelectSchema.extend({
  cells: z.array(proposedCellsSelectSchema.extend({ details: detailsSelectSchema })),
});

const schemaRoute = {
  params: z.object({
    id: z.coerce.string<string>(),
  }),
  body: requestSchema,
  response: {
    200: z.object({
      data: responseSchema,
    }),
  },
};

type ReqParams = { Params: { id: string } };
type ReqBody = { Body: z.infer<typeof requestSchema> };
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof responseSchema>;
type ExistingSubmission = NonNullable<Awaited<ReturnType<typeof db.query.submissions.findFirst>>>;

function hasActualChanges(body: z.infer<typeof requestSchema>, existing: ExistingSubmission): boolean {
  if (body.review_notes !== undefined && body.review_notes !== existing.review_notes) return true;
  if (body.submitter_note !== undefined && body.submitter_note !== existing.submitter_note) return true;

  if (isNonEmpty(body.station)) return true;
  if (isNonEmpty(body.location)) return true;
  if (body.cells?.length && body.cells.some(isNonEmpty)) return true;

  return false;
}

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");

  const { id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const [hasAdminPermission, submission] = await Promise.all([
    verifyPermissions(session.user.id, { submissions: ["update"] }),
    db.query.submissions.findFirst({ where: { id } }),
  ]);

  if (!submission) throw new ErrorResponse("NOT_FOUND");

  const isOwner = submission.submitter_id === session.user.id;

  if (!hasAdminPermission && !isOwner) throw new ErrorResponse("FORBIDDEN");

  if (!hasAdminPermission && submission.status !== "pending")
    throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be modified" });

  if (!hasAdminPermission && req.body.review_notes !== undefined) throw new ErrorResponse("FORBIDDEN", { message: "Cannot modify review notes" });

  if (!hasActualChanges(req.body, submission))
    throw new ErrorResponse("BAD_REQUEST", { message: "No changes detected. Please modify the data before updating." });

  if (req.body.cells && req.body.cells.length > 0) {
    validateCellDuplicates(req.body.cells);
    const operatorId = submission.station_id ? await getOperatorIdForStation(submission.station_id) : null;
    if (operatorId) {
      const entries = req.body.cells
        .filter((c) => c.details && c.operation !== "delete")
        .map((c) => ({ rat: c.rat!, details: c.details as Record<string, unknown>, excludeCellId: c.target_cell_id ?? undefined }));
      await checkCellDuplicatesBatch(entries, operatorId);
    }
  }

  try {
    const result = await db.transaction(async (tx) => {
      const updateFields: Record<string, unknown> = { updatedAt: new Date() };
      if (req.body.review_notes !== undefined) updateFields.review_notes = req.body.review_notes;
      if (req.body.submitter_note !== undefined) updateFields.submitter_note = req.body.submitter_note;

      await tx.update(submissions).set(updateFields).where(eq(submissions.id, id));

      if (req.body.station) {
        await tx.delete(proposedStations).where(eq(proposedStations.submission_id, id));
        await tx.insert(proposedStations).values({
          ...req.body.station,
          submission_id: id,
        } as typeof proposedStations.$inferInsert);
      }

      if (req.body.location) {
        await tx.delete(proposedLocations).where(eq(proposedLocations.submission_id, id));
        await tx.insert(proposedLocations).values({
          ...req.body.location,
          submission_id: id,
        } as typeof proposedLocations.$inferInsert);
      }

      if (req.body.cells) {
        await tx.delete(proposedCells).where(eq(proposedCells.submission_id, id));

        /* eslint-disable no-await-in-loop */
        for (const cell of req.body.cells) {
          const { details, ...cellData } = cell;

          const [base] = await tx
            .insert(proposedCells)
            .values({
              ...cellData,
              submission_id: id,
              is_confirmed: hasAdminPermission ? (cellData.is_confirmed ?? false) : false,
              operation: cell.operation ?? "add",
            })
            .returning();
          if (!base) throw new ErrorResponse("FAILED_TO_UPDATE");

          if (details && cell.operation !== "delete") {
            await insertProposedCellDetails(tx, cell.rat, details as Record<string, unknown>, base.id);
          }
        }
        /* eslint-enable no-await-in-loop */
      }

      const [updated, rawCells] = await Promise.all([
        tx.query.submissions.findFirst({ where: { id } }),
        tx.query.proposedCells.findMany({ where: { submission_id: id }, with: { gsm: true, umts: true, lte: true, nr: true } }),
      ]);
      if (!updated) throw new ErrorResponse("NOT_FOUND");

      const cells = rawCells.map(({ gsm, umts, lte, nr, ...base }) => ({
        ...base,
        details: gsm ?? umts ?? lte ?? nr ?? null,
      }));

      return { ...updated, cells };
    });

    await createAuditLog(
      {
        action: "submissions.update",
        table_name: "submissions",
        record_id: undefined,
        old_values: submission,
        new_values: result,
        metadata: { submission_id: id },
      },
      req,
    );

    return res.send({ data: result });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_UPDATE");
  }
}

const updateSubmission: Route<RequestData, ResponseData> = {
  url: "/submissions/:id",
  method: "PATCH",
  schema: schemaRoute,
  handler,
};

export default updateSubmission;
