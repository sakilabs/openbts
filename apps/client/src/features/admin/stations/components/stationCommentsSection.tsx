import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Delete02Icon, UserIcon, Calendar03Icon, Message01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchApiData, API_BASE } from "@/lib/api";
import type { StationComment } from "@/types/station";

type StationCommentsSectionProps = {
	stationId: number;
};

export function StationCommentsSection({ stationId }: StationCommentsSectionProps) {
	const { t, i18n } = useTranslation("submissions");
	const queryClient = useQueryClient();

	const { data: comments = [], isLoading } = useQuery({
		queryKey: ["station-comments", stationId],
		queryFn: () =>
			fetchApiData<StationComment[]>(`stations/${stationId}/comments`, {
				allowedErrors: [404, 403],
			}).then((data) => data ?? []),
	});

	const deleteMutation = useMutation({
		mutationFn: async (commentId: number) => {
			const response = await fetch(`${API_BASE}/stations/${stationId}/comments/${commentId}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to delete comment");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["station-comments", stationId] });
			toast.success(t("stationComments.deleted"));
		},
		onError: () => {
			toast.error(t("stationComments.deleteFailed"));
		},
	});

	const handleDelete = (commentId: number) => {
		if (window.confirm(t("stationComments.deleteConfirm"))) {
			deleteMutation.mutate(commentId);
		}
	};

	return (
		<Collapsible defaultOpen>
			<div className="border rounded-xl overflow-hidden">
				<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
					<CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-0 -rotate-90"
						/>
						<HugeiconsIcon icon={Message01Icon} className="size-4 text-primary" />
						<span className="font-semibold text-sm">{t("stationComments.title")}</span>
						<span className="text-xs text-muted-foreground">({comments.length})</span>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Spinner />
						</div>
					) : comments.length === 0 ? (
						<div className="flex items-center justify-center py-8 text-sm text-muted-foreground">{t("stationComments.noComments")}</div>
					) : (
						<div className="divide-y">
							{comments.map((comment) => (
								<div key={comment.id} className="flex gap-3 p-4">
									<Avatar className="size-8 shrink-0">
										{comment.author?.avatar_url && <AvatarImage src={comment.author.avatar_url} alt={comment.author.name} />}
										<AvatarFallback>
											<HugeiconsIcon icon={UserIcon} className="size-4" />
										</AvatarFallback>
									</Avatar>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span className="font-semibold text-sm">{comment.author?.name ?? `User #${comment.author_id}`}</span>
												<span className="flex items-center gap-1 text-xs text-muted-foreground">
													<HugeiconsIcon icon={Calendar03Icon} className="size-3" />
													{new Date(comment.createdAt).toLocaleDateString(i18n.language)}
												</span>
											</div>

											<Button
												variant="ghost"
												size="sm"
												className="text-muted-foreground hover:text-destructive"
												onClick={() => handleDelete(comment.id)}
												disabled={deleteMutation.isPending}
											>
												<HugeiconsIcon icon={Delete02Icon} className="size-4" />
											</Button>
										</div>

										<p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>

										{comment.attachments && comment.attachments.length > 0 && (
											<div className="flex items-center gap-2 mt-2 flex-wrap">
												{comment.attachments.map((attachment) => (
													<div key={attachment.uuid} className="relative size-16 rounded-md overflow-hidden border bg-muted">
														{attachment.type.startsWith("image") ? (
															<img src={`${API_BASE}/attachments/${attachment.uuid}`} alt="" className="size-full object-cover" />
														) : (
															<div className="flex items-center justify-center size-full">
																<HugeiconsIcon icon={Image01Icon} className="size-5 text-muted-foreground" />
															</div>
														)}
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
