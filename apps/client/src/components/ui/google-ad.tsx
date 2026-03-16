import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/authClient";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

type AdFormat = "auto" | "horizontal" | "rectangle" | "vertical";

interface GoogleAdProps {
  adSlot: string;
  adFormat?: AdFormat;
  className?: string;
}

const PRIVILEGED_ROLES = new Set(["admin", "editor", "moderator"]);

export function GoogleAd({ adSlot, adFormat = "auto", className }: GoogleAdProps) {
  const { data: session } = authClient.useSession();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adblocker might have blocked it or whatever
    }
  }, []);

  if (PRIVILEGED_ROLES.has(session?.user?.role as string) || !AD_CLIENT) return null;

  return (
    <div className={cn("overflow-hidden", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
