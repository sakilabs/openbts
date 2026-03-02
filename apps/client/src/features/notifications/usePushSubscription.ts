import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { subscribeToPush, unsubscribeFromPush } from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscription(sub))
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
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await subscribeToPush(sub);
      setSubscription(sub);
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
      setSubscription(null);
    } catch {
      toast.error("Failed to disable notifications");
    }
  }, [subscription]);

  const isSupported = "Notification" in window && "serviceWorker" in navigator;

  return { subscription, permission, isSubscribing, subscribe, unsubscribe, isSupported };
}
