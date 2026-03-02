import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Tick02Icon, Cancel01Icon, Notification02Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/lib/format";
import { authClient } from "@/lib/authClient";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNotifications } from "../useNotifications";
import { usePushSubscription } from "../usePushSubscription";
import type { Notification } from "../api";

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const { t } = useTranslation("notifications");
  const { t: tCommon } = useTranslation("common");
  const icon = notification.type === "submission_approved" ? Tick02Icon : notification.type === "new_submission" ? Add01Icon : Cancel01Icon;
  const iconColor =
    notification.type === "submission_approved" ? "text-green-500" : notification.type === "new_submission" ? "text-blue-500" : "text-red-500";
  const stationId = notification.metadata?.station_id as string | undefined;
  const reviewerNote = notification.metadata?.reviewer_note as string | undefined;
  const submitterName = notification.metadata?.submitter_name as string | undefined;

  const handleSelect = () => {
    if (!notification.readAt) onRead(notification.id);
  };

  const content = (
    <>
      <HugeiconsIcon icon={icon} size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${notification.readAt ? "text-muted-foreground" : ""}`}>{notification.title}</p>
        {submitterName && <p className="text-xs text-muted-foreground truncate">{t("submittedBy", { name: submitterName })}</p>}
        {stationId && <p className="text-xs text-muted-foreground truncate">{t("station", { stationId })}</p>}
        {reviewerNote && <p className="text-xs text-muted-foreground truncate italic">{reviewerNote}</p>}
        <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt, tCommon)}</p>
      </div>
    </>
  );

  if (notification.actionUrl) {
    return (
      <DropdownMenuItem render={<Link to={notification.actionUrl as "/"} />} className="flex items-start gap-2 py-2" onSelect={handleSelect}>
        {content}
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem className="flex items-start gap-2 py-2" onSelect={handleSelect}>
      {content}
    </DropdownMenuItem>
  );
}

export function NotificationsBell() {
  const { t } = useTranslation("notifications");
  const { data: session } = authClient.useSession();
  const { notifications, totalUnread, markAllRead, markRead } = useNotifications();
  const { subscription, permission, isSubscribing, subscribe, isSupported } = usePushSubscription();

  if (!session?.user) return null;

  const visibleNotifications = notifications.slice(0, 10);
  const hasUnread = totalUnread > 0;
  const showPushPrompt = isSupported && !subscription && permission !== "denied";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("title")}
          />
        }
      >
        <HugeiconsIcon icon={Notification01Icon} size={18} />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1.5">
          <p className="text-sm font-semibold">{t("title")}</p>
          {hasUnread && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                markAllRead();
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>

        <DropdownMenuSeparator />

        {showPushPrompt && (
          <>
            <button
              type="button"
              disabled={isSubscribing}
              onClick={() => void subscribe()}
              className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={Notification02Icon} size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{isSubscribing ? t("enabling") : t("enablePush")}</p>
                <p className="text-xs text-muted-foreground">{t("pushDescription")}</p>
              </div>
            </button>
            {visibleNotifications.length > 0 && <DropdownMenuSeparator />}
          </>
        )}

        {visibleNotifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</div>
        ) : (
          visibleNotifications.map((n) => <NotificationItem key={n.id} notification={n} onRead={markRead} />)
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
