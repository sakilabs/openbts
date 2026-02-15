import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, AlertCircleIcon, PencilEdit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { fetchApiData } from "@/lib/api";
import { authClient } from "@/lib/authClient";
import { formatShortDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { SubmissionRow } from "@/features/admin/submissions/types";

const fetchSubmissions = () => fetchApiData<SubmissionRow[]>("submissions");

export function MySubmissions() {
	const { t } = useTranslation(["submissions", "common"]);
	const { i18n } = useTranslation();
	const { data: session } = authClient.useSession();
	const queryClient = useQueryClient();

	const {
		data: allSubmissions,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["my-submissions"],
		queryFn: fetchSubmissions,
		staleTime: 0,
		refetchOnMount: "always",
		enabled: !!session?.user,
	});

	const deleteMutation = useMutation({
		mutationFn: deleteSubmission,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
			toast.success(t("toast.deleted"));
		},
		onError: () => toast.error(t("common:error.toast")),
	});

	const submissions = useMemo(
		() => allSubmissions?.filter((s) => s.submitter_id === session?.user?.id) ?? [],
		[allSubmissions, session?.user?.id],
	);

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-muted/10">
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
		<div className="space-y-2">
			{submissions.map((submission) => {
				const statusCfg = SUBMISSION_STATUS[submission.status];
				const typeCfg = SUBMISSION_TYPE[submission.type];
				const hasNotes = !!submission.review_notes;

				return (
					<div
						key={submission.id}
						className={cn("group rounded-xl border border-l-4 bg-card transition-colors overflow-hidden", statusCfg.borderClass)}
					>
						<div className="flex items-center gap-3 px-4 py-3">
							<span
								className={cn(
									"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
									typeCfg.badgeClass,
								)}
							>
								<span className={cn("size-1.5 rounded-full", typeCfg.dotClass)} />
								{t(`common:submissionType.${submission.type}`)}
							</span>

							<span className="text-xs font-mono text-muted-foreground">#{submission.id}</span>

							{submission.station?.station_id ? (
								<span className="text-sm font-mono font-medium text-foreground">{submission.station.station_id}</span>
							) : submission.proposedStation?.station_id ? (
								<span className="text-sm font-mono font-medium text-foreground">{submission.proposedStation.station_id}</span>
							) : null}

					<div className="ml-auto flex items-center gap-3">
						{submission.status === "pending" && (
							<div className="flex items-center gap-1">
								<Button size="icon-sm" variant="ghost" render={<Link to={`/submission?edit=${submission.id}`} />}>
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
											<AlertDialogAction variant="destructive" onClick={() => deleteMutation.mutate(submission.id)} disabled={deleteMutation.isPending}>
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
				);
			})}
		</div>
	);
}
