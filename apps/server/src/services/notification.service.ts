import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";

import db from "../database/psql.js";
import { notifications, pushSubscriptions, users } from "@openbts/drizzle";
import { logger } from "../utils/logger.js";

const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;

if (VAPID_SUBJECT && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export type NotificationType = "submission_approved" | "submission_rejected" | "new_submission";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  submissionId?: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

export async function createAndDeliverNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, type, title, submissionId, metadata, actionUrl } = params;

  await db.insert(notifications).values({
    userId,
    type,
    title,
    submissionId: submissionId ?? null,
    metadata: metadata ?? null,
    actionUrl: actionUrl ?? null,
  });

  const subs = await db.query.pushSubscriptions.findMany({
    where: { userId },
  });

  const payload = JSON.stringify({ title, metadata, actionUrl });

  await deliverPush(subs, payload);
}

async function deliverPush(subs: { endpoint: string; p256dh: string; auth: string }[], payload: string): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          logger.warn("Failed to deliver push notification", { endpoint: sub.endpoint, status });
        }
      }
    }),
  );
}

const STAFF_ROLES = ["admin", "moderator", "editor"];

export async function notifyStaffNewSubmission(params: {
  submissionId: string;
  submitterName: string;
  submissionType: string;
  stationId?: string;
}): Promise<void> {
  const staffUsers = await db.select({ id: users.id }).from(users).where(inArray(users.role, STAFF_ROLES));

  if (staffUsers.length === 0) return;

  const title = "New submission";
  const metadata: Record<string, unknown> = {
    submitter_name: params.submitterName,
    submission_type: params.submissionType,
    ...(params.stationId ? { station_id: params.stationId } : {}),
  };
  const actionUrl = "/admin/submissions";

  await db.insert(notifications).values(
    staffUsers.map((u) => ({
      userId: u.id,
      type: "new_submission" as const,
      title,
      submissionId: params.submissionId,
      metadata,
      actionUrl,
    })),
  );

  const staffIds = staffUsers.map((u) => u.id);
  const allSubs = await db
    .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, staffIds));

  await deliverPush(allSubs, JSON.stringify({ title, metadata, actionUrl }));
}
