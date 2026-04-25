import { useEffect, useRef } from "react";

import { authClient } from "@/lib/authClient";
import { cn } from "@/lib/utils";

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

const PRIVILEGED_ROLES = new Set(["admin", "editor"]);

const MIN_HEIGHTS: Record<AdFormat, string> = {
  auto: "100px",
  horizontal: "90px",
  rectangle: "200px",
  vertical: "600px",
};

function pushAd() {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // adblocker might have blocked it
  }
}

export function GoogleAd({ adSlot, adFormat = "auto", className }: GoogleAdProps) {
  const { data: session } = authClient.useSession();
  const shouldRenderAd = !!AD_CLIENT && !PRIVILEGED_ROLES.has(session?.user?.role as string);
  const pushed = useRef(false);

  useEffect(() => {
    if (!shouldRenderAd) {
      pushed.current = false;
      return;
    }
    if (pushed.current) return;
    pushed.current = true;
    pushAd();
  }, [shouldRenderAd]);

  if (!shouldRenderAd) return null;

  return (
    <div className={cn("w-full", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: MIN_HEIGHTS[adFormat] }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={adFormat === "auto" ? "true" : "false"}
      />
    </div>
  );
}
