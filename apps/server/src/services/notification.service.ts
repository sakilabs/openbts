import webpush from "web-push";
import { and, eq, inArray, sql } from "drizzle-orm";

import db from "../database/psql.js";
import { notifications, pushSubscriptions, users } from "@openbts/drizzle";
import { t } from "../i18n/index.js";
import { logger } from "../utils/logger.js";

const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;

if (VAPID_SUBJECT && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export type NotificationType = "submission_approved" | "submission_rejected" | "new_submission";

const NOTIFICATION_TYPE_KEY: Record<NotificationType, "submissionApproved" | "submissionRejected" | "newSubmission"> = {
  submission_approved: "submissionApproved",
  submission_rejected: "submissionRejected",
  new_submission: "newSubmission",
};

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  submissionId?: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

export async function createAndDeliverNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, type, submissionId, metadata, actionUrl } = params;

  const user = await db.query.users.findFirst({ where: { id: userId }, columns: { locale: true } });
  const strings = t(NOTIFICATION_TYPE_KEY[type], user?.locale);
  const title = strings.title;

  const [inserted] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      submissionId: submissionId ?? null,
      metadata: metadata ?? null,
      actionUrl: actionUrl ?? null,
    })
    .returning({ id: notifications.id });

  const allSubs = await db.query.pushSubscriptions.findMany({ where: { userId } });
  const pushSubs =
    type === "submission_approved" || type === "submission_rejected" ? allSubs.filter((s) => s.preferences.submissionUpdates !== false) : allSubs;

  const payload = JSON.stringify({ title, body: strings.body, metadata, actionUrl, notificationId: inserted?.id });

  await deliverPush(pushSubs, payload);
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

export async function notifyUkeUpdate(): Promise<void> {
  const subs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      locale: users.locale,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(pushSubscriptions.userId, users.id))
    .where(sql`(${pushSubscriptions.preferences}->>'ukeUpdates')::boolean = true`);
  if (subs.length === 0) return;

  await Promise.allSettled(
    subs.map((sub) => {
      const strings = t("ukeUpdate", sub.locale);
      const payload = JSON.stringify({ title: strings.title, body: strings.body, actionUrl: "/" });
      return deliverPush([sub], payload);
    }),
  );
}

const STAFF_ROLES = ["admin", "editor"];

export async function notifyStaffNewSubmission(params: {
  submissionId: string;
  submitterName: string;
  submissionType: string;
  stationId?: string;
}): Promise<void> {
  const staffUsers = await db.select({ id: users.id, locale: users.locale }).from(users).where(inArray(users.role, STAFF_ROLES));
  if (staffUsers.length === 0) return;

  const metadata: Record<string, unknown> = {
    submitter_name: params.submitterName,
    submission_type: params.submissionType,
    ...(params.stationId ? { station_id: params.stationId } : {}),
  };
  const actionUrl = "/admin/submissions";

  const insertedNotifications = await db
    .insert(notifications)
    .values(
      staffUsers.map((u) => ({
        userId: u.id,
        type: "new_submission" as const,
        title: t("newSubmission", u.locale).title,
        submissionId: params.submissionId,
        metadata,
        actionUrl,
      })),
    )
    .returning({ id: notifications.id, userId: notifications.userId });

  const staffIds = staffUsers.map((u) => u.id);
  const localeByUser = new Map(staffUsers.map((u) => [u.id, u.locale]));
  const allSubs = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      userId: pushSubscriptions.userId,
    })
    .from(pushSubscriptions)
    .where(and(inArray(pushSubscriptions.userId, staffIds), sql`(${pushSubscriptions.preferences}->>'newSubmission') IS DISTINCT FROM 'false'`));

  const subsByUser = new Map<string, { endpoint: string; p256dh: string; auth: string }[]>();
  for (const sub of allSubs) {
    const existing = subsByUser.get(sub.userId) ?? [];
    existing.push({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth });
    subsByUser.set(sub.userId, existing);
  }

  await Promise.allSettled(
    insertedNotifications.map((notif) => {
      const userSubs = subsByUser.get(notif.userId) ?? [];
      const strings = t("newSubmission", localeByUser.get(notif.userId));
      return deliverPush(userSubs, JSON.stringify({ title: strings.title, body: strings.body, metadata, actionUrl, notificationId: notif.id }));
    }),
  );
}
