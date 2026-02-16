import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, AlertCircleIcon, UserIcon, Message01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import type { StationComment } from "@/types/station";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchApiData, API_BASE } from "@/lib/api";
import { AddCommentForm } from "./addCommentForm";
import { Spinner } from "@/components/ui/spinner";

const fetchComments = (stationId: number) =>
  fetchApiData<StationComment[]>(`stations/${stationId}/comments`, {
    allowedErrors: [404, 403],
  }).then((data) => data ?? []);

type CommentsListProps = {
  stationId: number;
};

export function CommentsList({ stationId }: CommentsListProps) {
  const { t, i18n } = useTranslation("stationDetails");
  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["station-comments", stationId],
    queryFn: () => fetchComments(stationId),
    enabled: !!stationId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground px-4">
        <div className="size-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive/50 mb-3">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
        </div>
        <p className="text-sm">{t("comments.unavailable")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed mx-2">
          <HugeiconsIcon icon={Message01Icon} className="size-10 mb-3 opacity-10" />
          <p className="text-sm font-medium">{t("comments.noComments")}</p>
          <p className="text-xs opacity-60 mt-1 px-6">{t("comments.noCommentsHint")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="size-9 shrink-0 border">
                <AvatarImage src={comment.author?.avatar_url || ""} />
                <AvatarFallback>
                  <HugeiconsIcon icon={UserIcon} className="size-4 opacity-50" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold">{comment.author?.name}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} className="size-3" />
                    {new Date(comment.createdAt).toLocaleDateString(i18n.language)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-muted/20 border text-sm leading-relaxed space-y-3">
                  <p>{comment.content}</p>

                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      {comment.attachments.map((attachment) => (
                        <a
                          key={attachment.uuid}
                          href={`${API_BASE}/attachments/${attachment.uuid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-lg overflow-hidden border bg-muted/20 hover:border-primary/50 transition-colors"
                        >
                          {attachment.type.startsWith("image/") ? (
                            <img src={`${API_BASE}/attachments/${attachment.uuid}`} alt="Attachment" className="size-20 object-cover" />
                          ) : (
                            <div className="size-20 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                              <HugeiconsIcon icon={Image01Icon} className="size-6" />
                              <span className="text-[10px]">{t("comments.file")}</span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {comments.length > 0 && <div className="border-t" />}
      <AddCommentForm stationId={stationId} />
    </div>
  );
}
