import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SubmissionDetail } from "@/features/admin/submissions/types";

export function SubmitterCard({ submission }: { submission: SubmissionDetail }) {
	const { t } = useTranslation("admin");

	return (
		<div className="border rounded-xl overflow-hidden bg-card">
			<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
				<HugeiconsIcon icon={UserIcon} className="size-4 text-primary" />
				<span className="font-semibold text-sm">{t("submissionDetail.submitter")}</span>
			</div>
			<div className="px-4 py-3 space-y-4">
				<div className="flex items-start gap-4">
					<Avatar className="size-10 border">
						<AvatarImage src={submission.submitter.image ?? undefined} />
						<AvatarFallback>{submission.submitter.name.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
					<div className="flex-1 space-y-1">
						<p className="text-sm font-medium leading-none">{submission.submitter.name}</p>
						<p className="text-xs text-muted-foreground">@{submission.submitter.displayUsername}</p>
						<p className="text-[11px] font-mono text-muted-foreground/70 select-all">{submission.submitter.id}</p>
					</div>
				</div>
				{submission.submitter_note ? (
					<div className="border-l-4 border-primary/40 bg-primary/5 rounded-r-lg p-3 space-y-1">
						<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("submissionDetail.submitterNoteLabel")}</p>
						<p className="text-sm leading-relaxed">{submission.submitter_note}</p>
					</div>
				) : (
					<p className="text-xs text-muted-foreground">{t("submissionDetail.noSubmitterNote")}</p>
				)}
			</div>
		</div>
	);
}
