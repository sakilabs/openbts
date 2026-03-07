import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, AlertCircleIcon, PencilEdit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";
import { showApiError } from "@/lib/api";
import { authClient } from "@/lib/authClient";
import { formatShortDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/features/admin/submissions/submissionUI";
import { deleteSubmission } from "@/features/submissions/api";
import { useMySubmissions } from "@/features/submissions/hooks/useMySubmissions";
import type { SubmissionRow } from "@/features/admin/submissions/types";

const ESTIMATED_ROW_HEIGHT = 56;

export function MySubmissions() {
  const { t, i18n } = useTranslation(["submissions", "common"]);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data, isLoading, error, isFetchingNextPage, hasNextPage, fetchNextPage } = useMySubmissions();

  const deleteMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      toast.success(t("toast.deleted"));
    },
    onError: (error) => showApiError(error),
  });

  const submissions = useMemo<SubmissionRow[]>(
    () => data?.pages.flatMap((p) => p.data).filter((s) => s.submitter_id === session?.user?.id) ?? [],
    [data, session?.user?.id],
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: submissions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
    gap: 8,
  });

  const items = virtualizer.getVirtualItems();

  const handleScrollRef = useRef<() => void>(null!);
  handleScrollRef.current = () => {
    if (!hasNextPage || isFetchingNextPage) return;
    const lastItem = items[items.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= submissions.length - 1) {
      void fetchNextPage();
    }
  };

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const handler = () => handleScrollRef.current();
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={`skeleton-${i}`} className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-muted/10">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-32 rounded ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <div className="size-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive/50 mb-3">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
        </div>
        <p className="text-sm">{t("common:placeholder.errorFetching")}</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-xl bg-muted/10">
        <HugeiconsIcon icon={SentIcon} className="size-8 mb-2 opacity-20" />
        <p className="text-sm font-medium">{t("table.empty")}</p>
        <p className="text-xs mt-1">{t("table.emptyHintUser")}</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualItem) => {
          const submission = submissions[virtualItem.index];
          const statusCfg = SUBMISSION_STATUS[submission.status];
          const typeCfg = SUBMISSION_TYPE[submission.type];
          const hasNotes = !!submission.review_notes;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className={cn("group rounded-xl border border-l-4 bg-card transition-colors overflow-hidden", statusCfg.borderClass)}>
                <div className="flex items-center gap-3 px-4 py-3 min-w-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border shrink-0",
                      typeCfg.badgeClass,
                    )}
                  >
                    <span className={cn("size-1.5 rounded-[1px]", typeCfg.dotClass)} />
                    {t(`common:submissionType.${submission.type}`)}
                  </span>

                  <span className="text-xs font-mono text-muted-foreground hidden sm:inline shrink-0">#{submission.id}</span>

                  {submission.station?.station_id ? (
                    <span className="text-sm font-mono font-medium text-foreground">{submission.station.station_id}</span>
                  ) : submission.proposedStation?.station_id ? (
                    <span className="text-sm font-mono font-medium text-foreground">{submission.proposedStation.station_id}</span>
                  ) : null}

                  <div className="ml-auto flex items-center gap-3">
                    {submission.status === "pending" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          nativeButton={false}
                          render={<Link to="/submission" search={{ edit: submission.id }} />}
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button size="icon-sm" variant="ghost" />}>
                            <HugeiconsIcon icon={Delete02Icon} className="size-3.5 text-destructive" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("mySubmissions.confirmDelete")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("mySubmissions.confirmDeleteDesc")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(submission.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {t("common:actions.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", statusCfg.bgClass)}>
                      <HugeiconsIcon icon={statusCfg.icon} className={cn("size-3.5", statusCfg.iconClass)} />
                      <span className="text-xs font-medium capitalize">{t(`common:status.${submission.status}`)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                      {formatShortDate(submission.createdAt, i18n.language)}
                    </span>
                  </div>
                </div>

                {hasNotes && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="border-l-4 border-primary/40 bg-primary/5 rounded-r-lg p-2 space-y-1">
                      <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider">{t("detail.reviewerResponse")}</p>
                      <p className="text-sm leading-relaxed text-foreground">{submission.review_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner className="size-4" />
        </div>
      )}
    </div>
  );
}
