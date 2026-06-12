import {
  cells,
  extraIdentificators,
  gsmCells,
  locationPhotos,
  locations,
  lteCells,
  nrCells,
  operators,
  stationPhotoSelections,
  stationSectors,
  stations,
  submissions,
  umtsCells,
} from "@openbts/drizzle";
import db from "@openbts/drizzle/db";
import { logger } from "better-auth";
import { and, count, eq, inArray } from "drizzle-orm";
import type { FastifyRequest } from "fastify";

import { ErrorResponse } from "../../errors.ts";
import { createAuditLog } from "../../services/auditLog.service.ts";
import { checkCellDuplicatesBatch, checkLTEPCIDuplicate, checkNRPCIDuplicate } from "../../services/cellDuplicateCheck.service.ts";
import { createAndDeliverNotification } from "../../services/notification.service.ts";
import { syncStationsPermitsAssociations } from "../../services/stationsPermitsAssociation.service.ts";
import type { DbTx } from "../../types/global.ts";
import { computeGnbidLength } from "../submission.helpers.ts";

async function upsertLocation(
  tx: DbTx,
  proposedLocation: { region_id: number; city: string | null; address: string | null; longitude: number; latitude: number },
  req: FastifyRequest,
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

async function migrateStationPhotos(tx: DbTx, stationId: number, newLocationId: number): Promise<void> {
  const selections = await tx.query.stationPhotoSelections.findMany({
    where: { station_id: stationId },
    with: { locationPhoto: { columns: { id: true, attachment_id: true } } },
  });

  const stationPhotoIds = selections.map((s) => s.location_photo_id);
  if (stationPhotoIds.length === 0) return;

  const attachmentIds = selections.map((s) => s.locationPhoto.attachment_id);

  const conflicting = await tx
    .select({ id: locationPhotos.id, attachment_id: locationPhotos.attachment_id })
    .from(locationPhotos)
    .where(and(eq(locationPhotos.location_id, newLocationId), inArray(locationPhotos.attachment_id, attachmentIds)));

  if (conflicting.length > 0) {
    const attachmentToNewPhotoId = new Map(conflicting.map((r) => [r.attachment_id, r.id]));
    const conflictingAttachmentIds = conflicting.map((r) => r.attachment_id);

    await Promise.all(
      selections
        .filter((sel) => attachmentToNewPhotoId.has(sel.locationPhoto.attachment_id))
        .map((sel) => {
          const newPhotoId = attachmentToNewPhotoId.get(sel.locationPhoto.attachment_id)!;
          return Promise.all([
            tx
              .insert(stationPhotoSelections)
              .values({ station_id: stationId, location_photo_id: newPhotoId, is_main: sel.is_main })
              .onConflictDoNothing(),
            tx
              .delete(stationPhotoSelections)
              .where(and(eq(stationPhotoSelections.station_id, stationId), eq(stationPhotoSelections.location_photo_id, sel.location_photo_id))),
          ]);
        }),
    );

    await tx
      .delete(locationPhotos)
      .where(and(inArray(locationPhotos.id, stationPhotoIds), inArray(locationPhotos.attachment_id, conflictingAttachmentIds)));
  }

  await tx.update(locationPhotos).set({ location_id: newLocationId }).where(inArray(locationPhotos.id, stationPhotoIds));
}

type ProposedSectorRow = {
  target_sector_id: number | null;
  local_id: string;
  azimuth: number;
};

type ProposedCellSectorRef = {
  target_sector_id: number | null;
  sector_local_id: string | null;
  sector_unassigned?: boolean;
};

function resolveProposedCellSectorId(proposed: ProposedCellSectorRef, sectorIdByLocalId: ReadonlyMap<string, number>): number | null | undefined {
  if (proposed.target_sector_id !== null && proposed.target_sector_id !== undefined) return proposed.target_sector_id;
  if (proposed.sector_local_id) return sectorIdByLocalId.get(proposed.sector_local_id) ?? null;
  if (proposed.sector_unassigned) return null;
  return undefined;
}

export async function approveSubmissionAction({
  submissionId,
  reviewerId,
  reviewerNotes,
  req,
}: {
  submissionId: string;
  reviewerId: string;
  reviewerNotes?: string | null;
  req: FastifyRequest;
}) {
  const submission = await db.query.submissions.findFirst({ where: { id: submissionId } });
  if (!submission) throw new ErrorResponse("NOT_FOUND");
  if (submission.status !== "pending") throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be approved" });

  if (submission.station_id !== null) {
    const station = await db.query.stations.findFirst({ where: { id: submission.station_id }, columns: { status: true } });
    if (!station || station.status !== "published")
      throw new ErrorResponse("NOT_FOUND", { message: "Station not found for the provided station_id" });
  }

  const transactionResult = await db.transaction(async (tx) => {
    const [proposedStation, proposedLocation, proposedSectorRows, proposedCellRows] = await Promise.all([
      tx.query.proposedStations.findFirst({ where: { submission_id: submissionId } }),
      tx.query.proposedLocations.findFirst({ where: { submission_id: submissionId } }),
      tx.query.proposedSectors.findMany({ where: { submission_id: submissionId }, orderBy: { id: "asc" } }),
      tx.query.proposedCells.findMany({ where: { submission_id: submissionId }, with: { gsm: true, umts: true, lte: true, nr: true } }),
    ]);

    let stationId = submission.station_id;

    let resolvedLocationId: number | null = null;

    if (submission.type === "new") {
      let locationId: number | null = null;

      if (proposedLocation) {
        locationId = await upsertLocation(tx, proposedLocation, req, submissionId);
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
          {
            action: "stations.create",
            table_name: "stations",
            record_id: newStation.id,
            new_values: newStation,
            metadata: { submission_id: submissionId },
          },
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
            .returning();
          if (newIdentifier) {
            await createAuditLog(
              {
                action: "stations.update",
                table_name: "extra_identificators",
                record_id: newStation.id,
                old_values: null,
                new_values: newIdentifier,
                metadata: { submission_id: submissionId },
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
              metadata: { submission_id: submissionId },
            },
            req,
            tx,
          );
        }
      } else {
        const locationAtNewCoords = await tx.query.locations.findFirst({
          where: { AND: [{ longitude: proposedLocation.longitude }, { latitude: proposedLocation.latitude }] },
        });

        if (currentLocation && !locationAtNewCoords) {
          const [newLoc] = await tx
            .insert(locations)
            .values({
              longitude: proposedLocation.longitude,
              latitude: proposedLocation.latitude,
              region_id: proposedLocation.region_id,
              city: proposedLocation.city,
              address: proposedLocation.address,
            })
            .returning();
          if (!newLoc) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create location" });
          resolvedLocationId = newLoc.id;
          await createAuditLog(
            {
              action: "locations.create",
              table_name: "locations",
              record_id: newLoc.id,
              new_values: newLoc,
              metadata: { submission_id: submissionId },
            },
            req,
            tx,
          );
          await tx.update(stations).set({ location_id: newLoc.id, updatedAt: new Date() }).where(eq(stations.id, stationId));
          await createAuditLog(
            {
              action: "stations.update",
              table_name: "stations",
              record_id: stationId,
              new_values: { location_id: newLoc.id },
              metadata: { submission_id: submissionId },
            },
            req,
            tx,
          );
          const [orphanedResult] = await tx.select({ orphaned: count() }).from(stations).where(eq(stations.location_id, currentLocation.id));
          if (Number(orphanedResult?.orphaned ?? 0) === 0) {
            await migrateStationPhotos(tx, stationId, newLoc.id);
            await tx.delete(locations).where(eq(locations.id, currentLocation.id));
            await createAuditLog(
              {
                action: "locations.delete",
                table_name: "locations",
                record_id: currentLocation.id,
                old_values: { longitude: currentLocation.longitude, latitude: currentLocation.latitude },
                metadata: { submission_id: submissionId },
              },
              req,
              tx,
            );
          }
        } else {
          const locationId = await upsertLocation(tx, proposedLocation, req, submissionId);
          resolvedLocationId = locationId;
          await tx.update(stations).set({ location_id: locationId, updatedAt: new Date() }).where(eq(stations.id, stationId));
          await createAuditLog(
            {
              action: "stations.update",
              table_name: "stations",
              record_id: stationId,
              new_values: { location_id: locationId },
              metadata: { submission_id: submissionId },
            },
            req,
            tx,
          );
          if (currentLocation) {
            const [orphanedResult] = await tx.select({ orphaned: count() }).from(stations).where(eq(stations.location_id, currentLocation.id));
            if (Number(orphanedResult?.orphaned ?? 0) === 0) {
              await migrateStationPhotos(tx, stationId, locationId);
              await tx.delete(locations).where(eq(locations.id, currentLocation.id));
              await createAuditLog(
                {
                  action: "locations.delete",
                  table_name: "locations",
                  record_id: currentLocation.id,
                  old_values: { longitude: currentLocation.longitude, latitude: currentLocation.latitude },
                  metadata: { submission_id: submissionId },
                },
                req,
                tx,
              );
            }
          }
        }
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
        const [updatedIdentifier] = existingIdentifier
          ? await tx
              .update(extraIdentificators)
              .set({
                networks_id: proposedNetworksId,
                networks_name: proposedNetworksName,
                mno_name: proposedMnoName,
                updatedAt: new Date(),
              })
              .where(eq(extraIdentificators.id, existingIdentifier.id))
              .returning()
          : await tx
              .insert(extraIdentificators)
              .values({
                station_id: stationId,
                networks_id: proposedNetworksId,
                networks_name: proposedNetworksName,
                mno_name: proposedMnoName,
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
              metadata: { submission_id: submissionId },
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
          metadata: { submission_id: submissionId },
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
    const sectorIdByLocalId = new Map<string, number>();
    let sectorIdsToDeleteAfterCells: number[] = [];
    let previousSectors: Array<{ id: number; azimuth: number }> = [];

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

    if (stationId && proposedSectorRows.length > 0) {
      previousSectors = await tx.query.stationSectors.findMany({
        where: { station_id: stationId },
        columns: { id: true, azimuth: true },
        orderBy: { id: "asc" },
      });
      const previousSectorIds = new Set(previousSectors.map((sector) => sector.id));
      const retainedSectorIds = new Set<number>();

      for (const proposed of proposedSectorRows as ProposedSectorRow[]) {
        if (proposed.target_sector_id !== null && previousSectorIds.has(proposed.target_sector_id)) {
          retainedSectorIds.add(proposed.target_sector_id);
          sectorIdByLocalId.set(proposed.local_id, proposed.target_sector_id);
          const current = previousSectors.find((sector) => sector.id === proposed.target_sector_id);
          if (current && current.azimuth !== proposed.azimuth)
            await tx
              .update(stationSectors)
              .set({ azimuth: proposed.azimuth })
              .where(and(eq(stationSectors.id, proposed.target_sector_id), eq(stationSectors.station_id, stationId)));
          continue;
        }

        const [insertedSector] = await tx
          .insert(stationSectors)
          .values({ station_id: stationId, azimuth: proposed.azimuth })
          .returning({ id: stationSectors.id });
        if (!insertedSector) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create station sector" });
        sectorIdByLocalId.set(proposed.local_id, insertedSector.id);
      }

      sectorIdsToDeleteAfterCells = previousSectors.filter((sector) => !retainedSectorIds.has(sector.id)).map((sector) => sector.id);
    }

    /* eslint-disable no-await-in-loop */
    if (stationId) {
      for (const proposed of proposedCellRows) {
        if (proposed.operation === "delete" || !proposed.band_id) continue;
        const excludeCellId = proposed.target_cell_id ?? undefined;
        if (proposed.rat === "LTE" && proposed.lte?.pci !== null && proposed.lte?.pci !== undefined)
          await checkLTEPCIDuplicate(stationId, proposed.band_id, proposed.lte.pci, proposed.lte.earfcn, excludeCellId);
        else if (proposed.rat === "NR" && proposed.nr?.pci !== null && proposed.nr?.pci !== undefined)
          await checkNRPCIDuplicate(stationId, proposed.band_id, proposed.nr.pci, proposed.nr.arfcn, excludeCellId);
      }
    }

    for (const proposed of proposedCellRows) {
      switch (proposed.operation) {
        case "add": {
          if (!stationId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot add cell without a station" });
          if (!proposed.rat) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot add cell without RAT" });
          if (!proposed.band_id) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot add cell without band" });
          const sectorId = resolveProposedCellSectorId(proposed, sectorIdByLocalId);

          const [newCell] = await tx
            .insert(cells)
            .values({
              station_id: stationId,
              band_id: proposed.band_id,
              sector_id: sectorId ?? null,
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
          const sectorId = resolveProposedCellSectorId(proposed, sectorIdByLocalId);
          if (sectorId !== undefined) cellUpdate.sector_id = sectorId;

          await tx.update(cells).set(cellUpdate).where(eq(cells.id, targetCellId));

          const rat = proposed.rat ?? targetCell.rat;
          let newDetails: Record<string, unknown> | null = null;
          switch (rat) {
            case "GSM": {
              const d = proposed.gsm;
              if (d) {
                const [updated] = await tx
                  .update(gsmCells)
                  .set({ lac: d.lac, cid: d.cid, e_gsm: d.e_gsm, updatedAt: new Date() })
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
                  .set({ lac: d.lac, arfcn: d.arfcn, rnc: d.rnc, cid: d.cid, updatedAt: new Date() })
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
                  .set({
                    tac: d.tac,
                    enbid: d.enbid,
                    clid: d.clid,
                    pci: d.pci,
                    earfcn: d.earfcn,
                    supports_iot: d.supports_iot,
                    updatedAt: new Date(),
                  })
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
                    updatedAt: new Date(),
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

    if (stationId && sectorIdsToDeleteAfterCells.length > 0) {
      const [assignedResult] = await tx.select({ value: count() }).from(cells).where(inArray(cells.sector_id, sectorIdsToDeleteAfterCells));
      if (Number(assignedResult?.value ?? 0) > 0)
        throw new ErrorResponse("BAD_REQUEST", { message: "Cannot delete sectors that are still assigned to cells" });
      await tx.delete(stationSectors).where(inArray(stationSectors.id, sectorIdsToDeleteAfterCells));
    }

    if (stationId && proposedSectorRows.length > 0) {
      const newSectors = await tx.query.stationSectors.findMany({
        where: { station_id: stationId },
        columns: { id: true, azimuth: true },
        orderBy: { id: "asc" },
      });
      await createAuditLog(
        {
          action: "stations.update",
          table_name: "station_sectors",
          record_id: stationId,
          old_values: previousSectors,
          new_values: newSectors,
          metadata: { submission_id: submissionId, station_id: stationId },
        },
        req,
        tx,
      );
    }

    if (cellsAdded.length > 0)
      await createAuditLog(
        {
          action: "cells.create",
          table_name: "cells",
          record_id: null,
          new_values: { cells: cellsAdded },
          metadata: { submission_id: submissionId, station_id: stationId },
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
          metadata: { submission_id: submissionId },
        },
        req,
        tx,
      );
    if (cellsDeleted.length > 0)
      await createAuditLog(
        {
          action: "cells.delete",
          table_name: "cells",
          record_id: null,
          old_values: { cells: cellsDeleted },
          metadata: { submission_id: submissionId },
        },
        req,
        tx,
      );

    if (submission.type === "update" && stationId) await tx.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, stationId));

    if (stationId && submission.type !== "delete") {
      const sid = stationId;
      const [photos, locationPhotoSels] = await Promise.all([
        tx.query.submissionPhotos.findMany({ where: { submission_id: submissionId } }),
        tx.query.submissionLocationPhotoSelections.findMany({ where: { submission_id: submissionId } }),
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
                submission_id: submissionId,
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

            const TMOBILE_MNC = 26002;
            const ORANGE_MNC = 26003;
            const stationOperator = await tx
              .select({ mnc: operators.mnc })
              .from(stations)
              .innerJoin(operators, eq(stations.operator_id, operators.id))
              .where(eq(stations.id, sid))
              .limit(1)
              .then((rows) => rows[0] ?? null);
            const siblingMnc = stationOperator?.mnc === TMOBILE_MNC ? ORANGE_MNC : stationOperator?.mnc === ORANGE_MNC ? TMOBILE_MNC : null;

            if (siblingMnc !== null) {
              const [siblingStation] = await tx
                .select({ id: stations.id })
                .from(stations)
                .innerJoin(operators, eq(stations.operator_id, operators.id))
                .where(and(eq(stations.location_id, photoLocationId), eq(operators.mnc, siblingMnc)));

              if (siblingStation) {
                const siblingExistingMain = await tx.query.stationPhotoSelections.findFirst({
                  where: { station_id: siblingStation.id, is_main: true },
                });
                await tx
                  .insert(stationPhotoSelections)
                  .values(
                    locationPhotoRows.map((lp, i) => ({
                      station_id: siblingStation.id,
                      location_photo_id: lp.id,
                      is_main: !siblingExistingMain && i === 0,
                    })),
                  )
                  .onConflictDoNothing();
              }
            }
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

        const mainSel = locationPhotoSels.find((s) => s.is_main);
        const mainIsAlreadyAssigned = mainSel !== undefined && existingIds.has(mainSel.location_photo_id);

        if (toInsert.length > 0) {
          const existingMain = await tx.query.stationPhotoSelections.findFirst({
            where: { station_id: sid, is_main: true },
          });
          await tx.insert(stationPhotoSelections).values(
            toInsert.map((s) => ({
              station_id: sid,
              location_photo_id: s.location_photo_id,
              is_main: !existingMain && !mainIsAlreadyAssigned && s.is_main,
            })),
          );
        }

        if (mainIsAlreadyAssigned) {
          await tx.update(stationPhotoSelections).set({ is_main: false }).where(eq(stationPhotoSelections.station_id, sid));
          await tx
            .update(stationPhotoSelections)
            .set({ is_main: true })
            .where(and(eq(stationPhotoSelections.station_id, sid), eq(stationPhotoSelections.location_photo_id, mainSel.location_photo_id)));
        }
      }
    }

    const now = new Date();
    const [updated] = await tx
      .update(submissions)
      .set({
        status: "approved",
        reviewer_id: reviewerId,
        review_notes: reviewerNotes ?? submission.review_notes,
        reviewed_at: now,
        updatedAt: now,
      })
      .where(eq(submissions.id, submissionId))
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
    void syncStationsPermitsAssociations().catch((e) =>
      logger.error("Failed to sync stations_permits after approval", { error: e instanceof Error ? e.message : String(e) }),
    );
  }

  await createAuditLog(
    {
      action: "submissions.approve",
      table_name: "submissions",
      record_id: null,
      old_values: { status: submission.status },
      new_values: { status: result.status, reviewer_id: result.reviewer_id, reviewed_at: result.reviewed_at },
      metadata: { submission_id: submissionId, type: submission.type, station_id: submission.station_id },
    },
    req,
  );

  void createAndDeliverNotification({
    userId: submission.submitter_id,
    type: "submission_approved",
    submissionId: submissionId,
    metadata: {
      ...(stationStringId ? { station_id: stationStringId } : {}),
      ...(result.review_notes ? { reviewer_note: result.review_notes.slice(0, 200) } : {}),
    },
    actionUrl: "/account/submissions",
  }).catch((e) => logger.error("Failed to send notification", { error: e }));

  return { submission: result, station_id: stationStringId };
}

export async function rejectSubmissionAction({
  submissionId,
  reviewerId,
  reviewerNotes,
  req,
}: {
  submissionId: string;
  reviewerId: string;
  reviewerNotes?: string | null;
  req: FastifyRequest;
}) {
  const submission = await db.query.submissions.findFirst({ where: { id: submissionId } });
  if (!submission) throw new ErrorResponse("NOT_FOUND");
  if (submission.status !== "pending") throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be approved" });

  const now = new Date();
  const [result] = await db
    .update(submissions)
    .set({
      status: "rejected",
      reviewer_id: reviewerId,
      review_notes: reviewerNotes ?? submission.review_notes,
      reviewed_at: now,
      updatedAt: now,
    })
    .where(eq(submissions.id, submissionId))
    .returning();
  if (!result) throw new ErrorResponse("FAILED_TO_UPDATE");

  await createAuditLog(
    {
      action: "submissions.reject",
      table_name: "submissions",
      record_id: null,
      old_values: submission,
      new_values: result,
      metadata: { submission_id: submissionId },
    },
    req,
  );

  const stationStringId = submission.station_id
    ? ((await db.query.stations.findFirst({ where: { id: submission.station_id }, columns: { station_id: true } }))?.station_id ?? null)
    : null;

  void createAndDeliverNotification({
    userId: submission.submitter_id,
    type: "submission_rejected",
    submissionId: submissionId,
    metadata: {
      ...(stationStringId ? { station_id: stationStringId } : {}),
      ...(result.review_notes ? { reviewer_note: result.review_notes.slice(0, 200) } : {}),
    },
    actionUrl: "/account/submissions",
  }).catch((e) => logger.error("Failed to send notification", { error: e }));

  return result;
}
