import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { subscribeToPush, unsubscribeFromPush } from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const STORAGE_KEY = "push_subscription_id";

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        setSubscription(sub);
        if (sub && !localStorage.getItem(STORAGE_KEY)) {
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
    if (!subscription) return;
    try {
      await unsubscribeFromPush(subscription.endpoint);
      await subscription.unsubscribe();
      localStorage.removeItem(STORAGE_KEY);
      setSubscription(null);
      setSubscriptionId(null);
    } catch {
      toast.error("Failed to disable notifications");
    }
  }, [subscription]);

  const isSupported = "Notification" in window && "serviceWorker" in navigator;

  return { subscription, subscriptionId, permission, isSubscribing, subscribe, unsubscribe, isSupported };
}
