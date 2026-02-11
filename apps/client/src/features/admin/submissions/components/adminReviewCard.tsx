import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminReviewCardProps = {
	reviewNotes: string;
	onReviewNotesChange: (value: string) => void;
	isReadOnly: boolean;
};

export function AdminReviewCard({ reviewNotes, onReviewNotesChange, isReadOnly }: AdminReviewCardProps) {
	const { t } = useTranslation("admin");

	return (
		<div className="border rounded-xl overflow-hidden bg-card">
			<div className="px-4 py-2.5 bg-muted/50 border-b">
				<span className="font-semibold text-sm">{t("submissionDetail.adminReview")}</span>
			</div>
			<div className="p-4 space-y-2">
				<Label>{t("submissionDetail.reviewNotes")}</Label>
				<Textarea
					value={reviewNotes}
					onChange={(e) => onReviewNotesChange(e.target.value)}
					placeholder={t("submissionDetail.reviewNotesPlaceholder")}
					rows={4}
					disabled={isReadOnly && !reviewNotes}
					readOnly={isReadOnly}
				/>
			</div>
		</div>
	);
}
