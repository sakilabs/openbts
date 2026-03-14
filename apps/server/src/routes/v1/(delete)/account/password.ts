import { and, eq } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { accounts } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify";
import type { EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";

async function handler(req: FastifyRequest, res: ReplyPayload<EmptyResponse>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const userPasskeys = await db.query.passkeys.findMany({
    where: { userId: session.user.id },
    columns: { id: true },
  });

  if (userPasskeys.length === 0) {
    throw new ErrorResponse("FORBIDDEN", {
      message: "You must have at least one passkey registered before removing your password.",
    });
  }

  await db.delete(accounts).where(and(eq(accounts.userId, session.user.id), eq(accounts.providerId, "credential")));

  return res.status(204).send();
}

const deleteAccountPassword: Route<object, void> = {
  url: "/account/password",
  method: "DELETE",
  handler,
};

export default deleteAccountPassword;
