import { stations, cells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const stationsSelectSchema = createSelectSchema(stations).strict();
const stationsInsertSchema = createInsertSchema(stations);
const cellsInsertSchema = createInsertSchema(cells).strict();
type ReqBody = {
	Body: z.infer<typeof stationsSelectSchema> & { cells: z.infer<typeof cellsInsertSchema>[] };
};
type ResponseData = z.infer<typeof stationsSelectSchema>;
const schemaRoute = {
	body: stationsInsertSchema.extend({
		cells: z.array(cellsInsertSchema),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: stationsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { cells: cellsData, ...stationData } = req.body;

	try {
		const station = await db.transaction(async (tx) => {
			const [newStation] = await tx
				.insert(stations)
				.values({
					...stationData,
					updatedAt: new Date(),
					createdAt: new Date(),
				})
				.returning();

			if (!newStation) {
				tx.rollback();
				throw new ErrorResponse("FAILED_TO_CREATE");
			}

			if (cellsData && cellsData?.length > 0) {
				await tx.insert(cells).values(
					cellsData.map((cell) => ({
						...cell,
						station_id: newStation.id,
						is_confirmed: false,
						updatedAt: new Date(),
						createdAt: new Date(),
					})),
				);
			}

			return newStation;
		});

		return res.send({ success: true, data: station });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createStation: Route<ReqBody, ResponseData> = {
	url: "/stations",
	method: "POST",
	config: { permissions: ["write:stations"] },
	schema: schemaRoute,
	handler,
};

export default createStation;
