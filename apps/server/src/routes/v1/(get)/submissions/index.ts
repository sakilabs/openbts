import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { stations, submissions, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

const submissionsSchema = createSelectSchema(submissions);
const stationsSchema = createSelectSchema(stations);
const usersSchema = createSelectSchema(users).omit({ password: true });
const schemaRoute = {
	response: {
		200: z.object({
			success: z.boolean(),
			data: submissionsSchema.extend({
				station: stationsSchema,
				submitter: usersSchema,
				reviewer: usersSchema.optional(),
			}),
		}),
	},
};
type Submission = z.infer<typeof submissionsSchema> & {
	station: z.infer<typeof stationsSchema>;
	submitter: z.infer<typeof usersSchema>;
	reviewer?: z.infer<typeof usersSchema>;
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Submission[]>>) {
	const submissions = await db.query.submissions.findMany({
		with: {
			station: true,
			submitter: true,
			reviewer: true,
		},
	});

	return res.send({ success: true, data: submissions });
}

const getSubmissions: Route<RouteGenericInterface, Submission[]> = {
	url: "/submissions",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	schema: schemaRoute,
	handler,
};

export default getSubmissions;
