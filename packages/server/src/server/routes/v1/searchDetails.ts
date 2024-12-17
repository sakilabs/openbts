import { sql } from "drizzle-orm";
import { and, eq, or } from "drizzle-orm/pg-core/expressions";

import { db } from "../../database/index.js";
import { mnoData, networks } from "../../database/schemas/networksMno.js";
import { stations } from "../../database/schemas/stations.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const schemaRoute = {
	body: {
		type: "object",
		properties: {
			searchQuery: { type: "string" },
		},
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							bts_id: { type: "number" },
							latitude: { type: "number" },
							longitude: { type: "number" },
							owner: { type: ["number", "null"] },
							type: { type: ["string", "null"] },
							location_type: { type: ["string", "null"] },
							region: { type: ["number", "null"] },
							mno_id: { type: ["number", "null"] },
							networks_id: { type: ["number", "null"] },
							networks_name: { type: ["string", "null"] },
							mno_name: { type: ["string", "null"] },
						},
					},
				},
			},
		},
	},
};

// const searchStationsFn = async (searchQuery: string) => {
// 	const lowerQuery = searchQuery.toLowerCase();
// 	const searchResults = await db.execute(
// 		sql`
//       SELECT DISTINCT
//         s.*,
//         n.networks_name,
//         n.networks_id,
//         m.mno_id,
//         m.mno_name
//       FROM ${stations} s
//       LEFT JOIN ${networks} n ON n.networks_id = s.networks_id
//       LEFT JOIN ${mnoData} m ON m.mno_internal_id = s.mno_id
//       WHERE
//         LOWER(n.networks_name) LIKE '%' || ${lowerQuery} || '%'
//         OR LOWER(m.mno_name) LIKE '%' || ${lowerQuery} || '%'
//         OR (
//           ${!Number.isNaN(Number(searchQuery))}
//           AND (
//             n.networks_id = ${Number(searchQuery)}
//             OR m.mno_id = ${Number(searchQuery)}
//           )
//         )
//       ORDER BY s.bts_id
// 			LIMIT 50
//     `,
// 	);

// 	return searchResults;
// };

const searchStationsFn = async (searchQuery: string) => {
	const lowerQuery = searchQuery.toLowerCase();
	const isNumeric = !Number.isNaN(Number(searchQuery));

	const searchResults = await db
		.selectDistinct({
			bts_id: stations.bts_id,
			latitude: stations.latitude,
			longitude: stations.longitude,
			owner: stations.owner,
			type: stations.type,
			location_type: stations.location_type,
			region: stations.region,
			networks_name: networks.networks_name,
			networks_id: networks.networks_id,
			mno_id: mnoData.mno_id,
			mno_name: mnoData.mno_name,
		})
		.from(stations)
		.leftJoin(networks, eq(networks.networks_id, stations.networks_id))
		.leftJoin(mnoData, eq(mnoData.mno_internal_id, stations.mno_id))
		.where(
			or(
				sql`LOWER(${networks.networks_name}) LIKE ${`%${lowerQuery}%`}`,
				sql`LOWER(${mnoData.mno_name}) LIKE ${`%${lowerQuery}%`}`,
				and(
					sql`${isNumeric}`,
					or(eq(networks.networks_id, isNumeric ? Number(searchQuery) : -1), eq(mnoData.mno_id, isNumeric ? Number(searchQuery) : -1)),
				),
			),
		)
		.orderBy(stations.bts_id)
		.limit(50);

	return searchResults;
};

const searchStations: Route = {
	url: "/search",
	method: "POST",
	attachValidation: true,
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Body: { searchQuery: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { searchQuery } = req.body;
		if (!searchQuery) return res.status(400).send({ success: false, error: "Missing search query" });

		const result = await searchStationsFn(searchQuery);
		res.send({ success: true, data: result });
	},
};

export default searchStations;
