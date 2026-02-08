import { eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { verifyPermissions } from "../../../../../plugins/auth/utils.js";
import { submissions, stations, cells, locations, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const schemaRoute = {
	params: z.object({
		id: z.coerce.number<number>(),
	}),
	body: z
		.object({
			review_notes: z.string().optional(),
		})
		.optional(),
	response: {
		200: z.object({
			data: submissionsSelectSchema,
		}),
	},
};

type ReqParams = { Params: { id: number } };
type ReqBody = { Body: { review_notes?: string } | undefined };
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof submissionsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

	const hasPermission = await verifyPermissions(session.user.id, { submissions: ["update"] });
	if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

	try {
		const result = await db.transaction(async (tx) => {
			const submission = await tx.query.submissions.findFirst({
				where: (fields, { eq }) => eq(fields.id, id),
			});
			if (!submission) throw new ErrorResponse("NOT_FOUND");
			if (submission.status !== "pending") throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be approved" });

			const proposedStation = await tx.query.proposedStations.findFirst({
				where: (fields, { eq }) => eq(fields.submission_id, id),
			});

			const proposedLocation = await tx.query.proposedLocations.findFirst({
				where: (fields, { eq }) => eq(fields.submission_id, id),
			});

			const proposedCellRows = await tx.query.proposedCells.findMany({
				where: (fields, { eq }) => eq(fields.submission_id, id),
				with: { gsm: true, umts: true, lte: true, nr: true },
			});

			let stationId = submission.station_id;

			if (submission.type === "new") {
				let locationId: number | null = null;

				if (proposedLocation) {
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
					locationId = newLocation.id;
				}

				if (proposedStation) {
					const [newStation] = await tx
						.insert(stations)
						.values({
							station_id: proposedStation.station_id ?? "",
							location_id: locationId ?? proposedStation.location_id,
							operator_id: proposedStation.operator_id,
							notes: proposedStation.notes,
							is_confirmed: true,
							status: "published",
						})
						.returning();
					if (!newStation) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create station" });
					stationId = newStation.id;
				}
			}

			if (submission.type === "update" && proposedLocation && stationId) {
				const existingLocation = await tx.query.locations.findFirst({
					where: (fields, { and, eq: feq }) =>
						and(feq(fields.longitude, proposedLocation.longitude), feq(fields.latitude, proposedLocation.latitude)),
				});

				let locationId: number;

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
					}
					locationId = existingLocation.id;
				} else {
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
					locationId = newLocation.id;
				}

				await tx.update(stations).set({ location_id: locationId, updatedAt: new Date() }).where(eq(stations.id, stationId));
			}

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
								is_confirmed: true,
							})
							.returning();
						if (!newCell) throw new ErrorResponse("FAILED_TO_CREATE", { message: "Failed to create cell" });

						switch (proposed.rat) {
							case "GSM": {
								const d = proposed.gsm;
								if (d) await tx.insert(gsmCells).values({ cell_id: newCell.id, lac: d.lac, cid: d.cid, e_gsm: d.e_gsm });
								break;
							}
							case "UMTS": {
								const d = proposed.umts;
								if (d) await tx.insert(umtsCells).values({ cell_id: newCell.id, lac: d.lac, carrier: d.carrier, rnc: d.rnc, cid: d.cid });
								break;
							}
							case "LTE": {
								const d = proposed.lte;
								if (d)
									await tx
										.insert(lteCells)
										.values({ cell_id: newCell.id, tac: d.tac, enbid: d.enbid, clid: d.clid, supports_nb_iot: d.supports_nb_iot });
								break;
							}
							case "NR": {
								const d = proposed.nr;
								if (d)
									await tx.insert(nrCells).values({
										cell_id: newCell.id,
										nrtac: d.nrtac,
										gnbid: d.gnbid,
										clid: d.clid,
										pci: d.pci,
										supports_nr_redcap: d.supports_nr_redcap,
									});
								break;
							}
						}
						break;
					}

					case "update": {
						const targetCellId = proposed.target_cell_id;
						if (!targetCellId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot update cell without target_cell_id" });

						const targetCell = await tx.query.cells.findFirst({
							where: (fields, { eq }) => eq(fields.id, targetCellId),
						});
						if (!targetCell) throw new ErrorResponse("NOT_FOUND", { message: `Target cell ${targetCellId} not found` });

						const cellUpdate: Record<string, unknown> = { updatedAt: new Date() };
						if (proposed.band_id) cellUpdate.band_id = proposed.band_id;
						if (proposed.rat) cellUpdate.rat = proposed.rat;
						if (proposed.notes !== null) cellUpdate.notes = proposed.notes;

						await tx.update(cells).set(cellUpdate).where(eq(cells.id, targetCellId));

						const rat = proposed.rat ?? targetCell.rat;
						switch (rat) {
							case "GSM": {
								const d = proposed.gsm;
								if (d) await tx.update(gsmCells).set({ lac: d.lac, cid: d.cid, e_gsm: d.e_gsm }).where(eq(gsmCells.cell_id, targetCellId));
								break;
							}
							case "UMTS": {
								const d = proposed.umts;
								if (d)
									await tx
										.update(umtsCells)
										.set({ lac: d.lac, carrier: d.carrier, rnc: d.rnc, cid: d.cid })
										.where(eq(umtsCells.cell_id, targetCellId));
								break;
							}
							case "LTE": {
								const d = proposed.lte;
								if (d)
									await tx
										.update(lteCells)
										.set({ tac: d.tac, enbid: d.enbid, clid: d.clid, supports_nb_iot: d.supports_nb_iot })
										.where(eq(lteCells.cell_id, targetCellId));
								break;
							}
							case "NR": {
								const d = proposed.nr;
								if (d)
									await tx
										.update(nrCells)
										.set({
											nrtac: d.nrtac,
											gnbid: d.gnbid,
											gnbid_length: d.gnbid_length,
											clid: d.clid,
											pci: d.pci,
											supports_nr_redcap: d.supports_nr_redcap,
										})
										.where(eq(nrCells.cell_id, targetCellId));
								break;
							}
						}
						break;
					}

					case "delete": {
						const targetCellId = proposed.target_cell_id;
						if (!targetCellId) throw new ErrorResponse("BAD_REQUEST", { message: "Cannot delete cell without target_cell_id" });

						const targetCell = await tx.query.cells.findFirst({
							where: (fields, { eq }) => eq(fields.id, targetCellId),
						});
						if (!targetCell) throw new ErrorResponse("NOT_FOUND", { message: `Target cell ${targetCellId} not found` });

						await tx.delete(cells).where(eq(cells.id, targetCellId));
						break;
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

			return updated;
		});

		return res.send({ data: result });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
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
