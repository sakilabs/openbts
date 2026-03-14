import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdFormat = "auto" | "horizontal" | "rectangle" | "vertical";

interface GoogleAdProps {
  adClient: string;
  adSlot: string;
  adFormat?: AdFormat;
  className?: string;
}

export function GoogleAd({ adClient, adSlot, adFormat = "auto", className }: GoogleAdProps) {
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

  return (
    <div className={cn("overflow-hidden", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
