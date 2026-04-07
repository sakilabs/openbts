import type { FastifyRequest } from "fastify/types/request.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

function isUploadedImage(image: string | null | undefined): boolean {
  if (!image) return false;
  return !image.startsWith("http") && image.endsWith(".webp");
}

const schemaRoute = {
  response: {
    200: z.object({ data: z.null() }),
  },
};

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<null>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
  const userId = session.user.id;

  const currentUser = await db.query.users.findFirst({
    where: { id: userId },
    columns: { image: true },
  });

  if (!currentUser?.image) return res.send({ data: null });

  if (isUploadedImage(currentUser.image)) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, currentUser.image));
    } catch {}
  }

  return res.send({ data: null });
}

const deleteAvatar: Route<Record<string, never>, null> = {
  url: "/account/avatar",
  method: "DELETE",
  config: { allowLoggedIn: true },
  schema: schemaRoute,
  handler,
};

export default deleteAvatar;
