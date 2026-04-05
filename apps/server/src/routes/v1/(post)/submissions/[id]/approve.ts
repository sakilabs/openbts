import { eq, inArray, and } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { getRuntimeSettings } from "../../../../../services/settings.service.js";
import { createAuditLog } from "../../../../../services/auditLog.service.js";
import { verifyPermissions } from "../../../../../plugins/auth/utils.js";
import { rebuildStationsPermitsAssociations } from "../../../../../services/stationsPermitsAssociation.service.js";
import { createAndDeliverNotification } from "../../../../../services/notification.service.js";
import { computeGnbidLength } from "../../../../../utils/submission.helpers.js";
import { checkCellDuplicatesBatch } from "../../../../../services/cellDuplicateCheck.service.js";
import { logger } from "../../../../../utils/logger.js";
import {
  submissions,
  stations,
  cells,
  locations,
  gsmCells,
  umtsCells,
  lteCells,
  nrCells,
  extraIdentificators,
  locationPhotos,
  stationPhotoSelections,
} from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const schemaRoute = {
  params: z.object({
    id: z.coerce.string<string>(),
  }),
  body: z
    .object({
      review_notes: z.string().nullable().optional(),
    })
    .optional(),
  response: {
    200: z.object({
      data: submissionsSelectSchema,
    }),
  },
};

type ReqParams = { Params: { id: string } };
type ReqBody = { Body: { review_notes?: string } | undefined };
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof submissionsSelectSchema>;

async function upsertLocation(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  proposedLocation: { region_id: number; city: string | null; address: string | null; longitude: number; latitude: number },
  req: FastifyRequest<RequestData>,
  submissionId: string,
): Promise<number> {
  const existingLocation = await tx.query.locations.findFirst({
    where: {
      AND: [{ longitude: proposedLocation.longitude }, { latitude: proposedLocation.latitude }],
    },
  });

  if (existingLocation) {
    const metadataChanged =
      existingLocation.region_id !== proposedLocation.region_id ||
      existingLocation.city !== proposedLocation.city ||
      existingLocation.address !== proposedLocation.address;

    if (metadataChanged) {
      await tx
        .update(locations)
        .set({
          region_id: proposedLocation.region_id,
          city: proposedLocation.city,
          address: proposedLocation.address,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, existingLocation.id));
      await createAuditLog(
        {
          action: "locations.update",
          table_name: "locations",
          record_id: existingLocation.id,
          old_values: { region_id: existingLocation.region_id, city: existingLocation.city, address: existingLocation.address },
          new_values: { region_id: proposedLocation.region_id, city: proposedLocation.city, address: proposedLocation.address },
          metadata: { submission_id: submissionId },
        },
        req,
        tx,
      );
    }
    return existingLocation.id;
  }

  const [newLocation] = await tx
    .insert(locations)
    .values({
      region_id: proposedLocation.region_id,
      city: proposedLocation.city,
      address: proposedLocation.address,
      longitude: proposedLocation.longitude,
      latitude: proposedLocation.latitude,
    })
    .returning();
  if (!newLocation) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create location" });
  await createAuditLog(
    {
      action: "locations.create",
      table_name: "locations",
      record_id: newLocation.id,
      new_values: newLocation,
      metadata: { submission_id: submissionId },
    },
    req,
    tx,
  );
  return newLocation.id;
}

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
  const { id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const [hasPermission, submission] = await Promise.all([
    verifyPermissions(session.user.id, { submissions: ["update"] }),
    db.query.submissions.findFirst({ where: { id } }),
  ]);
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");
  if (!submission) throw new ErrorResponse("NOT_FOUND");
  if (submission.status !== "pending") throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be approved" });

  try {
    const transactionResult = await db.transaction(async (tx) => {
      const [proposedStation, proposedLocation, proposedCellRows] = await Promise.all([
        tx.query.proposedStations.findFirst({ where: { submission_id: id } }),
        tx.query.proposedLocations.findFirst({ where: { submission_id: id } }),
        tx.query.proposedCells.findMany({ where: { submission_id: id }, with: { gsm: true, umts: true, lte: true, nr: true } }),
      ]);

      let stationId = submission.station_id;

      let resolvedLocationId: number | null = null;

      if (submission.type === "new") {
        let locationId: number | null = null;

        if (proposedLocation) {
          locationId = await upsertLocation(tx, proposedLocation, req, id);
        }

        if (proposedStation) {
          const [newStation] = await tx
            .insert(stations)
            .values({
              station_id: proposedStation.station_id ?? "",
              location_id: locationId,
              operator_id: proposedStation.operator_id,
              notes: typeof proposedStation.notes === "string" && proposedStation.notes.trim() !== "" ? proposedStation.notes : null,
              is_confirmed: true,
              status: "published",
            })
            .returning();
          if (!newStation) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create station" });
          stationId = newStation.id;
          await createAuditLog(
            { action: "stations.create", table_name: "stations", record_id: newStation.id, new_values: newStation, metadata: { submission_id: id } },
            req,
            tx,
          );

          if (proposedStation.networks_id || proposedStation.mno_name) {
            const [newIdentifier] = await tx
              .insert(extraIdentificators)
              .values({
                station_id: newStation.id,
                networks_id: proposedStation.networks_id ?? null,
                networks_name: proposedStation.networks_name ?? null,
                mno_name: proposedStation.mno_name ?? null,
              })
              .onConflictDoUpdate({
                target: [extraIdentificators.station_id, extraIdentificators.networks_id],
                set: {
                  networks_name: proposedStation.networks_name ?? null,
                  mno_name: proposedStation.mno_name ?? null,
                  updatedAt: new Date(),
                },
              })
              .returning();
            if (newIdentifier) {
              await createAuditLog(
                {
                  action: "stations.update",
                  table_name: "extra_identificators",
                  record_id: newStation.id,
                  old_values: null,
                  new_values: newIdentifier,
                  metadata: { submission_id: id },
                },
                req,
                tx,
              );
            }
          }
        }
        resolvedLocationId = locationId;
      }

      if (submission.type === "update" && proposedLocation && stationId) {
        const currentStation = await tx.query.stations.findFirst({
          where: { id: stationId },
          with: { location: true },
        });

        const currentLocation = currentStation?.location ?? null;

        const coordsUnchanged =
          currentLocation && currentLocation.longitude === proposedLocation.longitude && currentLocation.latitude === proposedLocation.latitude;

        if (coordsUnchanged) {
          resolvedLocationId = currentLocation.id;
          const metadataChanged =
            currentLocation.region_id !== proposedLocation.region_id ||
            currentLocation.city !== proposedLocation.city ||
            currentLocation.address !== proposedLocation.address;

          if (metadataChanged) {
            await tx
              .update(locations)
              .set({ region_id: proposedLocation.region_id, city: proposedLocation.city, address: proposedLocation.address, updatedAt: new Date() })
              .where(eq(locations.id, currentLocation.id));
            await createAuditLog(
              {
                action: "locations.update",
                table_name: "locations",
                record_id: currentLocation.id,
                old_values: { region_id: currentLocation.region_id, city: currentLocation.city, address: currentLocation.address },
                new_values: { region_id: proposedLocation.region_id, city: proposedLocation.city, address: proposedLocation.address },
                metadata: { submission_id: id },
              },
              req,
              tx,
            );
          }
        } else {
          const locationId = await upsertLocation(tx, proposedLocation, req, id);
          resolvedLocationId = locationId;
          await tx.update(stations).set({ location_id: locationId, updatedAt: new Date() }).where(eq(stations.id, stationId));
          await createAuditLog(
            {
              action: "stations.update",
              table_name: "stations",
              record_id: stationId,
              new_values: { location_id: locationId },
              metadata: { submission_id: id },
            },
            req,
            tx,
          );
        }
      }

      if (submission.type === "update" && proposedStation && (proposedStation.networks_id || proposedStation.mno_name) && stationId) {
        const existingIdentifier = await tx.query.extraIdentificators.findFirst({ where: { station_id: stationId } });
        const proposedNetworksId = proposedStation.networks_id ?? null;
        const proposedNetworksName = proposedStation.networks_name ?? null;
        const proposedMnoName = proposedStation.mno_name ?? null;
        const hasIdentifierChanges =
          !existingIdentifier ||
          existingIdentifier.networks_id !== proposedNetworksId ||
          existingIdentifier.networks_name !== proposedNetworksName ||
          existingIdentifier.mno_name !== proposedMnoName;

        if (hasIdentifierChanges) {
          const [updatedIdentifier] = await tx
            .insert(extraIdentificators)
            .values({
              station_id: stationId,
              networks_id: proposedNetworksId,
              networks_name: proposedNetworksName,
              mno_name: proposedMnoName,
            })
            .onConflictDoUpdate({
              target: [extraIdentificators.station_id, extraIdentificators.networks_id],
              set: {
                networks_name: proposedNetworksName,
                mno_name: proposedMnoName,
                updatedAt: new Date(),
              },
            })
            .returning();
          if (updatedIdentifier) {
            await createAuditLog(
              {
                action: "stations.update",
                table_name: "extra_identificators",
                record_id: stationId,
                old_values: existingIdentifier ?? null,
                new_values: updatedIdentifier,
                metadata: { submission_id: id },
              },
              req,
              tx,
            );
          }
        }
      }

      if (submission.type === "delete") {
        if (!stationId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot delete without a station" });
        await tx.update(stations).set({ status: "inactive", updatedAt: new Date() }).where(eq(stations.id, stationId));
        await createAuditLog(
          {
            action: "stations.update",
            table_name: "stations",
            record_id: stationId,
            new_values: { status: "inactive" },
            metadata: { submission_id: id },
          },
          req,
          tx,
        );
      }

      const targetCellIds = proposedCellRows
        .filter((c) => (c.operation === "update" || c.operation === "delete") && c.target_cell_id)
        .map((c) => c.target_cell_id!);

      const targetCellsArr =
        targetCellIds.length > 0
          ? await tx.query.cells.findMany({
              where: { id: { in: targetCellIds } },
              with: { gsm: true, umts: true, lte: true, nr: true },
            })
          : [];
      const targetCellsMap = new Map(targetCellsArr.map((tc) => [tc.id, tc] as const));

      const cellsAdded: Array<Record<string, unknown>> = [];
      const cellsUpdated: Array<{ old: Record<string, unknown>; new: Record<string, unknown> }> = [];
      const cellsDeleted: Array<Record<string, unknown>> = [];

      const approveOperatorId =
        submission.type === "new"
          ? (proposedStation?.operator_id ?? null)
          : stationId
            ? ((await tx.query.stations.findFirst({ where: { id: stationId }, columns: { operator_id: true } }))?.operator_id ?? null)
            : null;

      if (approveOperatorId) {
        const dupEntries = proposedCellRows
          .filter((c) => c.operation !== "delete" && c.rat)
          .map((c) => {
            const details = (c.lte ?? c.gsm ?? c.umts ?? c.nr) as Record<string, unknown> | null;
            return { rat: c.rat!, details, excludeCellId: c.target_cell_id ?? undefined };
          })
          .filter((e): e is typeof e & { details: Record<string, unknown> } => e.details !== null);
        if (dupEntries.length > 0) await checkCellDuplicatesBatch(dupEntries, approveOperatorId);
      }

      /* eslint-disable no-await-in-loop */
      for (const proposed of proposedCellRows) {
        switch (proposed.operation) {
          case "add": {
            if (!stationId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot add cell without a station" });
            if (!proposed.rat) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot add cell without RAT" });
            if (!proposed.band_id) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot add cell without band" });

            const [newCell] = await tx
              .insert(cells)
              .values({
                station_id: stationId,
                band_id: proposed.band_id,
                rat: proposed.rat,
                notes: proposed.notes,
                is_confirmed: proposed.is_confirmed,
              })
              .returning();
            if (!newCell) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create cell" });

            let newCellDetails: Record<string, unknown> | null = null;
            switch (proposed.rat) {
              case "GSM": {
                const d = proposed.gsm;
                if (d) {
                  const [inserted] = await tx.insert(gsmCells).values({ cell_id: newCell.id, lac: d.lac, cid: d.cid, e_gsm: d.e_gsm }).returning();
                  newCellDetails = inserted ?? null;
                }
                break;
              }
              case "UMTS": {
                const d = proposed.umts;
                if (d) {
                  const [inserted] = await tx
                    .insert(umtsCells)
                    .values({ cell_id: newCell.id, lac: d.lac, arfcn: d.arfcn, rnc: d.rnc, cid: d.cid })
                    .returning();
                  newCellDetails = inserted ?? null;
                }
                break;
              }
              case "LTE": {
                const d = proposed.lte;
                if (d) {
                  const [inserted] = await tx
                    .insert(lteCells)
                    .values({
                      cell_id: newCell.id,
                      tac: d.tac,
                      enbid: d.enbid,
                      clid: d.clid,
                      pci: d.pci,
                      earfcn: d.earfcn,
                      supports_iot: d.supports_iot,
                    })
                    .returning();
                  newCellDetails = inserted ?? null;
                }
                break;
              }
              case "NR": {
                const d = proposed.nr;
                if (d) {
                  const [inserted] = await tx
                    .insert(nrCells)
                    .values({
                      cell_id: newCell.id,
                      nrtac: d.nrtac,
                      gnbid: d.gnbid,
                      gnbid_length: computeGnbidLength(d.gnbid),
                      clid: d.clid,
                      pci: d.pci,
                      arfcn: d.arfcn,
                      type: d.type,
                      supports_nr_redcap: d.supports_nr_redcap,
                    })
                    .returning();
                  newCellDetails = inserted ?? null;
                }
                break;
              }
            }
            cellsAdded.push({ ...newCell, details: newCellDetails });
            break;
          }

          case "update": {
            const targetCellId = proposed.target_cell_id;
            if (!targetCellId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot update cell without target_cell_id" });

            const targetCell = targetCellsMap.get(targetCellId);
            if (!targetCell) throw new ErrorResponse("NOT_FOUND", { message: `Target cell ${targetCellId} not found` });

            const cellUpdate: Record<string, unknown> = { updatedAt: new Date() };
            if (proposed.band_id) cellUpdate.band_id = proposed.band_id;
            if (proposed.rat) cellUpdate.rat = proposed.rat;
            if (proposed.notes !== null) cellUpdate.notes = proposed.notes;

            await tx.update(cells).set(cellUpdate).where(eq(cells.id, targetCellId));

            const rat = proposed.rat ?? targetCell.rat;
            let newDetails: Record<string, unknown> | null = null;
            switch (rat) {
              case "GSM": {
                const d = proposed.gsm;
                if (d) {
                  const [updated] = await tx
                    .update(gsmCells)
                    .set({ lac: d.lac, cid: d.cid, e_gsm: d.e_gsm })
                    .where(eq(gsmCells.cell_id, targetCellId))
                    .returning();
                  newDetails = updated ?? null;
                }
                break;
              }
              case "UMTS": {
                const d = proposed.umts;
                if (d) {
                  const [updated] = await tx
                    .update(umtsCells)
                    .set({ lac: d.lac, arfcn: d.arfcn, rnc: d.rnc, cid: d.cid })
                    .where(eq(umtsCells.cell_id, targetCellId))
                    .returning();
                  newDetails = updated ?? null;
                }
                break;
              }
              case "LTE": {
                const d = proposed.lte;
                if (d) {
                  const [updated] = await tx
                    .update(lteCells)
                    .set({ tac: d.tac, enbid: d.enbid, clid: d.clid, pci: d.pci, earfcn: d.earfcn, supports_iot: d.supports_iot })
                    .where(eq(lteCells.cell_id, targetCellId))
                    .returning();
                  newDetails = updated ?? null;
                }
                break;
              }
              case "NR": {
                const d = proposed.nr;
                if (d) {
                  const [updated] = await tx
                    .update(nrCells)
                    .set({
                      nrtac: d.nrtac,
                      gnbid: d.gnbid,
                      gnbid_length: d.gnbid ? computeGnbidLength(d.gnbid) : d.gnbid_length,
                      clid: d.clid,
                      pci: d.pci,
                      arfcn: d.arfcn,
                      supports_nr_redcap: d.supports_nr_redcap,
                    })
                    .where(eq(nrCells.cell_id, targetCellId))
                    .returning();
                  newDetails = updated ?? null;
                }
                break;
              }
            }

            const { gsm: _gsm, umts: _umts, lte: _lte, nr: _nr, ...baseCellOld } = targetCell;
            const oldDetails = _gsm ?? _umts ?? _lte ?? _nr ?? null;

            cellsUpdated.push({ old: { ...baseCellOld, details: oldDetails }, new: { ...baseCellOld, ...cellUpdate, details: newDetails } });
            break;
          }

          case "delete": {
            const targetCellId = proposed.target_cell_id;
            if (!targetCellId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot delete cell without target_cell_id" });

            const targetCell = targetCellsMap.get(targetCellId);
            if (!targetCell) throw new ErrorResponse("NOT_FOUND", { message: `Target cell ${targetCellId} not found` });

            await tx.delete(cells).where(eq(cells.id, targetCellId));
            const { gsm: _dGsm, umts: _dUmts, lte: _dLte, nr: _dNr, ...baseCellDelete } = targetCell;
            const deleteDetails = _dGsm ?? _dUmts ?? _dLte ?? _dNr ?? null;
            cellsDeleted.push({ ...baseCellDelete, details: deleteDetails });
            break;
          }
        }
      }
      /* eslint-enable no-await-in-loop */

      if (cellsAdded.length > 0)
        await createAuditLog(
          {
            action: "cells.create",
            table_name: "cells",
            record_id: null,
            new_values: { cells: cellsAdded },
            metadata: { submission_id: id, station_id: stationId },
          },
          req,
          tx,
        );
      if (cellsUpdated.length > 0)
        await createAuditLog(
          {
            action: "cells.update",
            table_name: "cells",
            record_id: null,
            old_values: { cells: cellsUpdated.map((c) => c.old) },
            new_values: { cells: cellsUpdated.map((c) => c.new) },
            metadata: { submission_id: id },
          },
          req,
          tx,
        );
      if (cellsDeleted.length > 0)
        await createAuditLog(
          { action: "cells.delete", table_name: "cells", record_id: null, old_values: { cells: cellsDeleted }, metadata: { submission_id: id } },
          req,
          tx,
        );

      if (submission.type === "update" && stationId) await tx.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, stationId));

      if (stationId && submission.type !== "delete") {
        const sid = stationId;
        const [photos, locationPhotoSels] = await Promise.all([
          tx.query.submissionPhotos.findMany({ where: { submission_id: id } }),
          tx.query.submissionLocationPhotoSelections.findMany({ where: { submission_id: id } }),
        ]);

        if (photos.length > 0) {
          const photoLocationId =
            resolvedLocationId ?? (await tx.query.stations.findFirst({ where: { id: sid }, columns: { location_id: true } }))?.location_id ?? null;
          if (photoLocationId) {
            await tx
              .insert(locationPhotos)
              .values(
                photos.map((p) => ({
                  location_id: photoLocationId,
                  attachment_id: p.attachment_id,
                  submission_id: id,
                  uploaded_by: submission.submitter_id,
                  note: p.note,
                  taken_at: p.taken_at,
                })),
              )
              .onConflictDoNothing();

            const locationPhotoRows = await tx
              .select({ id: locationPhotos.id })
              .from(locationPhotos)
              .where(
                and(
                  eq(locationPhotos.location_id, photoLocationId),
                  inArray(
                    locationPhotos.attachment_id,
                    photos.map((p) => p.attachment_id),
                  ),
                ),
              );

            if (locationPhotoRows.length > 0) {
              const existingMain = await tx.query.stationPhotoSelections.findFirst({
                where: { station_id: sid, is_main: true },
              });
              await tx
                .insert(stationPhotoSelections)
                .values(
                  locationPhotoRows.map((lp, i) => ({
                    station_id: sid,
                    location_photo_id: lp.id,
                    is_main: !existingMain && i === 0,
                  })),
                )
                .onConflictDoNothing();
            }
          }
        }

        if (locationPhotoSels.length > 0) {
          const requestedIds = locationPhotoSels.map((s) => s.location_photo_id);
          const existingRows = await tx
            .select({ location_photo_id: stationPhotoSelections.location_photo_id })
            .from(stationPhotoSelections)
            .where(and(eq(stationPhotoSelections.station_id, sid), inArray(stationPhotoSelections.location_photo_id, requestedIds)));
          const existingIds = new Set(existingRows.map((r) => r.location_photo_id));
          const toInsert = locationPhotoSels.filter((s) => !existingIds.has(s.location_photo_id));
          if (toInsert.length > 0) {
            await tx
              .insert(stationPhotoSelections)
              .values(toInsert.map((s) => ({ station_id: sid, location_photo_id: s.location_photo_id, is_main: false })));
          }
        }
      }

      const now = new Date();
      const [updated] = await tx
        .update(submissions)
        .set({
          status: "approved",
          reviewer_id: session.user.id,
          review_notes: req.body?.review_notes ?? submission.review_notes,
          reviewed_at: now,
          updatedAt: now,
        })
        .where(eq(submissions.id, id))
        .returning();
      if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

      let stationStringId: string | null = null;
      if (submission.type === "new" && proposedStation) {
        stationStringId = proposedStation.station_id ?? null;
      } else if (stationId) {
        const stationRow = await tx.query.stations.findFirst({ where: { id: stationId }, columns: { station_id: true } });
        stationStringId = stationRow?.station_id ?? null;
      }

      return { submission: updated, resolvedStationId: stationId, stationStringId };
    });

    const { submission: result, stationStringId } = transactionResult;

    if (submission.type === "new") {
      void rebuildStationsPermitsAssociations().catch((e) =>
        logger.error("Failed to rebuild stations_permits after approval", { error: e instanceof Error ? e.message : String(e) }),
      );
    }

    await createAuditLog(
      {
        action: "submissions.approve",
        table_name: "submissions",
        record_id: null,
        old_values: { status: submission.status },
        new_values: { status: result.status, reviewer_id: result.reviewer_id, reviewed_at: result.reviewed_at },
        metadata: { submission_id: id, type: submission.type, station_id: submission.station_id },
      },
      req,
    );

    void createAndDeliverNotification({
      userId: submission.submitter_id,
      type: "submission_approved",
      submissionId: id,
      metadata: {
        ...(stationStringId ? { station_id: stationStringId } : {}),
        ...(result.review_notes ? { reviewer_note: result.review_notes.slice(0, 200) } : {}),
      },
      actionUrl: "/account/submissions",
    }).catch((e) => logger.error("Failed to send notification", { error: e }));

    return res.send({ data: result });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    if (error instanceof Error) throw new ErrorResponse("INTERNAL_SERVER_ERROR", { message: error.message });
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", { message: "An unknown error occurred" });
  }
}

const approveSubmission: Route<RequestData, ResponseData> = {
  url: "/submissions/:id/approve",
  method: "POST",
  config: { permissions: ["update:submissions"] },
  schema: schemaRoute,
  handler,
};

export default approveSubmission;
