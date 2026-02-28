import { useState, useCallback, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, Alert02Icon, AlertCircleIcon, Cancel01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const DISMISSED_KEY = "openbts:dismissed-announcement";

const typeConfig = {
  info: {
    icon: InformationCircleIcon,
    className: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
    dismissClassName: "text-blue-700/70 hover:text-blue-700 dark:text-blue-400/70 dark:hover:text-blue-400",
  },
  warning: {
    icon: Alert02Icon,
    className: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
    dismissClassName: "text-amber-700/70 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-400",
  },
  error: {
    icon: AlertCircleIcon,
    className: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
    dismissClassName: "text-red-700/70 hover:text-red-700 dark:text-red-400/70 dark:hover:text-red-400",
  },
} as const;

export function AnnouncementBanner() {
  const { data: settings } = useSettings();
  const [dismissed, setDismissed] = useState(() => {
    let value: string | null = null;
    try {
      value = localStorage.getItem(DISMISSED_KEY);
    } catch {}
    return value ?? "";
  });
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const announcement = settings?.announcement;

  const handleDismiss = useCallback(() => {
    if (!announcement?.message) return;
    setDismissed(announcement.message);
    try {
      localStorage.setItem(DISMISSED_KEY, announcement.message);
    } catch {}
  }, [announcement]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!announcement?.enabled || !announcement.message) return null;
  if (dismissed === announcement.message) return null;

  const config = typeConfig[announcement.type] ?? typeConfig.info;

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 border-b text-sm shrink-0", config.className)}>
      <HugeiconsIcon icon={config.icon} className="size-4 shrink-0" />
      <p ref={textRef} className={cn("flex-1 min-w-0", expanded ? "wrap-break-word" : "truncate")}>{announcement.message}</p>
      <div className="flex items-center gap-1 shrink-0">
        {(isTruncated || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={cn("rounded-full p-0.5 transition-colors", config.dismissClassName)}
            aria-label={expanded ? "Collapse announcement" : "Expand announcement"}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
        <button type="button" onClick={handleDismiss} className={cn("rounded-full p-0.5 transition-colors", config.dismissClassName)}>
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
