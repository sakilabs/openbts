import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { subscribeToPush, unsubscribeFromPush } from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const STORAGE_KEY = "push_subscription_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getStoredId(): string | null {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && UUID_RE.test(v)) return v;
  if (v) localStorage.removeItem(STORAGE_KEY);
  return null;
}

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(getStoredId);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const syncing = useRef(false);
  const subscriptionRef = useRef(subscription);

  useEffect(() => {
    subscriptionRef.current = subscription;
  }, [subscription]);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        setSubscription(sub);
        if (sub && !getStoredId() && !syncing.current) {
          syncing.current = true;
          const id = await subscribeToPush(sub);
          localStorage.setItem(STORAGE_KEY, id);
          setSubscriptionId(id);
        }
      })
      .catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!("Notification" in window)) return;
    setIsSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission denied");
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        toast.success("Notifications enabled");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });
      const id = await subscribeToPush(sub);
      localStorage.setItem(STORAGE_KEY, id);
      setSubscription(sub);
      setSubscriptionId(id);
      toast.success("Push notifications enabled");
    } catch (err) {
      console.error("Push subscription failed:", err);
      toast.error("Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    const sub = subscriptionRef.current;
    if (!sub) return;
    try {
      await unsubscribeFromPush(sub.endpoint);
      await sub.unsubscribe();
      localStorage.removeItem(STORAGE_KEY);
      setSubscription(null);
      setSubscriptionId(null);
    } catch {
      toast.error("Failed to disable notifications");
    }
  }, []);

  const isSupported = "Notification" in window && "serviceWorker" in navigator;

  return { subscription, subscriptionId, permission, isSubscribing, subscribe, unsubscribe, isSupported };
}
