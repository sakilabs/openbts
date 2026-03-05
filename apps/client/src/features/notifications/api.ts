import { fetchApiData, fetchJson, postApiData, API_BASE } from "@/lib/api";

export type Notification = {
  id: string;
  userId: string;
  type: "submission_approved" | "submission_rejected" | "new_submission";
  title: string;
  submissionId: string | null;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  data: Notification[];
  totalUnread: number;
  total: number;
};

export async function fetchNotifications(params?: { limit?: number; offset?: number }): Promise<NotificationsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return fetchJson<NotificationsResponse>(`${API_BASE}/notifications${query ? `?${query}` : ""}`);
}

export async function markAllRead(): Promise<{ updated: number }> {
  return postApiData<{ updated: number }>("notifications/read-all", {});
}

export async function markRead(id: string): Promise<Notification> {
  return fetchApiData<Notification>(`notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function subscribeToPush(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  await postApiData("push/subscribe", {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  });
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  await fetchJson(`${API_BASE}/push/subscribe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
