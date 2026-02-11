import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
import type { SubmissionDetail } from "@/features/admin/submissions/types";

type SubmissionDetailHeaderProps = {
	submission: SubmissionDetail;
	isReadOnly: boolean;
	isProcessing: boolean;
	onApprove: () => void;
	onReject: () => void;
	onSave: () => void;
};

export function SubmissionDetailHeader({ submission, isReadOnly, isProcessing, onApprove, onReject, onSave }: SubmissionDetailHeaderProps) {
	const navigate = useNavigate();
	const { t } = useTranslation(["admin", "common"]);

	return (
		<div className="shrink-0 border-b bg-background/90 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-sm transition-all">
			<div className="flex items-center">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate(-1)}
					className="text-muted-foreground hover:text-foreground gap-2 pl-1 pr-3 -ml-2 hover:bg-muted/50 transition-colors"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					<span className="font-medium">{t("common:actions.back")}</span>
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<span
					className={cn(
						"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
						SUBMISSION_TYPE[submission.type].badgeClass,
					)}
				>
					<span className={cn("size-1.5 rounded-full", SUBMISSION_TYPE[submission.type].dotClass)} />
					{t(`common:submissionType.${submission.type}`)}
				</span>
				<div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", SUBMISSION_STATUS[submission.status].bgClass)}>
					<HugeiconsIcon
						icon={SUBMISSION_STATUS[submission.status].icon}
						className={cn("size-3.5", SUBMISSION_STATUS[submission.status].iconClass)}
					/>
					<span className="text-xs font-medium capitalize">{t(`common:status.${submission.status}`)}</span>
				</div>
				<span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">{submission.id}</span>
			</div>

			<div className="flex items-center gap-2">
				{isReadOnly ? (
					<div className="text-sm font-medium text-muted-foreground px-4">{t("submissionDetail.readOnly")}</div>
				) : (
					<>
						<AlertDialog>
							<AlertDialogTrigger
								render={
									<Button
										variant="outline"
										size="sm"
										disabled={isProcessing}
										className="text-destructive hover:text-destructive hover:bg-destructive/10"
									/>
								}
							>
								{t("submissionDetail.reject")}
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t("submissionDetail.confirmReject")}</AlertDialogTitle>
									<AlertDialogDescription>{t("submissionDetail.confirmRejectDesc")}</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
									<AlertDialogAction variant="destructive" onClick={onReject} disabled={isProcessing}>
										{t("submissionDetail.reject")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<AlertDialog>
							<AlertDialogTrigger
								render={
									<Button variant="default" size="sm" disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" />
								}
							>
								{t("submissionDetail.approve")}
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t("submissionDetail.confirmApprove")}</AlertDialogTitle>
									<AlertDialogDescription>{t("submissionDetail.confirmApproveDesc")}</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
									<AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={onApprove} disabled={isProcessing}>
										{t("submissionDetail.approve")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Button size="sm" onClick={onSave} disabled={isProcessing} className="shadow-sm font-medium px-4 min-w-20">
							{isProcessing ? <Spinner /> : t("common:actions.saveChanges")}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
