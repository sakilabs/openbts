import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Tick02Icon, Cancel01Icon, Clock01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { fetchApiData } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SubmissionRow = {
	id: number;
	station_id: number | null;
	submitter_id: string;
	status: "pending" | "approved" | "rejected";
	type: "new" | "update" | "delete";
	review_notes: string | null;
	reviewer_id: string | null;
	createdAt: string;
	updatedAt: string;
	reviewed_at: string | null;
	station?: { station_id: string } | null;
};

const fetchSubmissions = () => fetchApiData<SubmissionRow[]>("submissions");

const STATUS_CONFIG = {
	pending: {
		icon: Clock01Icon,
		variant: "outline" as const,
		className: "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700",
	},
	approved: {
		icon: Tick02Icon,
		variant: "outline" as const,
		className: "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
	},
	rejected: {
		icon: Cancel01Icon,
		variant: "outline" as const,
		className: "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700",
	},
} as const;

const TYPE_CONFIG = {
	new: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
	update: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
	delete: "bg-red-500/15 text-red-700 dark:text-red-300",
} as const;

export function MySubmissions() {
	const { t } = useTranslation("settings");
	const { i18n } = useTranslation();
	const { data: session } = authClient.useSession();

	const { data: allSubmissions, isLoading, error } = useQuery({
		queryKey: ["my-submissions"],
		queryFn: fetchSubmissions,
		staleTime: 1000 * 60 * 2,
		enabled: !!session?.user,
	});

	const submissions = allSubmissions?.filter((s) => s.submitter_id === session?.user?.id) ?? [];

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
			<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-xl bg-muted/10">
				<HugeiconsIcon icon={InformationCircleIcon} className="size-8 mb-2 opacity-30" />
				<p className="text-sm">{t("submissions.loadError")}</p>
			</div>
		);
	}

	if (submissions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-xl bg-muted/10">
				<HugeiconsIcon icon={SentIcon} className="size-8 mb-2 opacity-20" />
				<p className="text-sm font-medium">{t("submissions.empty")}</p>
				<p className="text-xs mt-1">{t("submissions.emptyHint")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{submissions.map((submission) => {
				const statusCfg = STATUS_CONFIG[submission.status];
				const typeCls = TYPE_CONFIG[submission.type];

				return (
					<div
						key={submission.id}
						className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card transition-colors hover:bg-muted/30"
					>
						<span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md", typeCls)}>
							{t(`submissions.type.${submission.type}`)}
						</span>

						<span className="text-sm font-mono font-medium text-foreground min-w-[5rem]">
							{submission.station?.station_id ?? `#${submission.id}`}
						</span>

						<Badge variant={statusCfg.variant} className={cn("gap-1", statusCfg.className)}>
							<HugeiconsIcon icon={statusCfg.icon} className="size-3" />
							{t(`submissions.status.${submission.status}`)}
						</Badge>

						{submission.review_notes && (
							<Tooltip>
								<TooltipTrigger className="text-muted-foreground hover:text-foreground transition-colors cursor-default">
									<HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
								</TooltipTrigger>
								<TooltipContent side="top" className="max-w-xs text-xs">
									{submission.review_notes}
								</TooltipContent>
							</Tooltip>
						)}

						<span className="ml-auto text-xs text-muted-foreground tabular-nums">
							{new Date(submission.createdAt).toLocaleDateString(i18n.language, {
								year: "numeric",
								month: "short",
								day: "numeric",
							})}
						</span>
					</div>
				);
			})}
		</div>
	);
}
