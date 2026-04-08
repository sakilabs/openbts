import { attachments, locations } from "@openbts/drizzle";
import { eq, inArray } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";

import type { Database } from "../database/psql.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function deleteLocationWithPhotos(executor: Database | Transaction, locationId: number) {
  const photos = await executor.query.locationPhotos.findMany({
    where: { location_id: locationId },
    with: { attachment: { columns: { id: true, uuid: true } } },
  });

  await executor.delete(locations).where(eq(locations.id, locationId));

  const attachmentIds = photos.map((p) => p.attachment.id);
  if (attachmentIds.length > 0) await executor.delete(attachments).where(inArray(attachments.id, attachmentIds));

  await Promise.all(photos.map((p) => fs.unlink(path.join(UPLOAD_DIR, `${p.attachment.uuid}.webp`)).catch(() => {})));
}
