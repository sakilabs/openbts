import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getOperatorColor } from "@/lib/operatorUtils";
import { LocationPicker } from "@/features/submissions/components/locationPicker";
import type { ProposedLocationForm } from "@/features/submissions/types";
import type { Operator, Station } from "@/types/station";
import type { SubmissionDetail } from "@/features/admin/submissions/types";
import { ChangeBadge } from "./common";

type SubmissionStationFormProps = {
	submission: SubmissionDetail;
	stationForm: {
		station_id: string;
		operator_id: number | null;
		notes: string;
	};
	onStationFormChange: (patch: Partial<{ station_id: string; operator_id: number | null; notes: string }>) => void;
	locationForm: ProposedLocationForm;
	onLocationFormChange: (patch: Partial<ProposedLocationForm>) => void;
	operators: Operator[];
	selectedOperator?: Operator;
	currentOperator?: Operator | null;
	currentStation: Station | null;
	stationDiffs: { station_id: boolean; operator_id: boolean; notes: boolean } | null;
	locationDiffs: { coords: boolean; city: boolean; address: boolean } | null;
	isFormDisabled: boolean;
	isDeleteSubmission: boolean;
};

export function SubmissionStationForm({
	submission,
	stationForm,
	onStationFormChange,
	locationForm,
	onLocationFormChange,
	operators,
	selectedOperator,
	currentOperator,
	currentStation,
	stationDiffs,
	locationDiffs,
	isFormDisabled,
	isDeleteSubmission,
}: SubmissionStationFormProps) {
	const { t } = useTranslation("admin");

	return (
		<>
			<div className="border rounded-xl overflow-hidden bg-card">
				<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={AirportTowerIcon} className="size-4 text-primary" />
						<span className="font-semibold text-sm">{t("stationInfo.title")}</span>
					</div>
					{submission.station && (
						<Popover>
							<PopoverTrigger className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
								{t("submissionDetail.viewCurrent")}
								<HugeiconsIcon icon={ArrowLeft01Icon} className="size-3 rotate-180" />
							</PopoverTrigger>
							<PopoverContent side="bottom" align="end" className="w-64">
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">{t("stationInfo.stationId")}</span>
										<span className="text-sm font-mono font-medium">{submission.station.station_id}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">{t("stationInfo.operator")}</span>
										{(() => {
											const stationOp = operators.find((o) => o.id === submission.station?.operator_id);
											return stationOp ? (
												<div className="flex items-center gap-1.5">
													<div className="size-2 rounded-full" style={{ backgroundColor: getOperatorColor(stationOp.mnc) }} />
													<span className="text-sm">{stationOp.name}</span>
												</div>
											) : (
												<span className="text-sm text-muted-foreground">—</span>
											);
										})()}
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">{t("stationInfo.confirmed")}</span>
										<span className="text-sm">{submission.station.is_confirmed ? "Yes" : "No"}</span>
									</div>
									{submission.station.notes && (
										<div className="pt-1 border-t">
											<span className="text-xs text-muted-foreground">{t("stationInfo.notes")}</span>
											<p className="text-sm mt-0.5">{submission.station.notes}</p>
										</div>
									)}
								</div>
							</PopoverContent>
						</Popover>
					)}
				</div>
				<div className="px-4 py-3 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("stationInfo.stationId")}</Label>
							<Input
								value={stationForm.station_id}
								onChange={(e) => onStationFormChange({ station_id: e.target.value })}
								maxLength={16}
								disabled={isFormDisabled}
							/>
							{stationDiffs?.station_id && <ChangeBadge label={t("diff.current")} current={submission.station?.station_id as string} />}
						</div>
						<div className="space-y-2">
							<Label>{t("stationInfo.operator")}</Label>
							<Select
								value={stationForm.operator_id !== null ? stationForm.operator_id.toString() : ""}
								onValueChange={(v) => onStationFormChange({ operator_id: v ? Number.parseInt(v, 10) : null })}
								disabled={isFormDisabled}
							>
								<SelectTrigger>
									<SelectValue>
										{selectedOperator ? (
											<div className="flex items-center gap-2">
												<div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc) }} />
												{selectedOperator.name}
											</div>
										) : (
											t("stationInfo.selectOperator")
										)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{operators.map((op) => (
										<SelectItem key={op.id} value={op.id.toString()}>
											<div className="flex items-center gap-2">
												<div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
												{op.name}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{stationDiffs?.operator_id && currentOperator && <ChangeBadge label={t("diff.current")} current={currentOperator.name} />}
						</div>
					</div>
					<div className="space-y-2">
						<Label>{t("stationInfo.notes")}</Label>
						<Textarea value={stationForm.notes} onChange={(e) => onStationFormChange({ notes: e.target.value })} rows={3} disabled={isFormDisabled} />
						{stationDiffs?.notes && <ChangeBadge label={t("diff.current")} current={submission.station?.notes ?? "—"} />}
					</div>
				</div>
			</div>

			{!isDeleteSubmission && (
				<>
					<div className={cn(isFormDisabled && "pointer-events-none opacity-60")}>
						<LocationPicker location={locationForm} onLocationChange={(patch) => !isFormDisabled && onLocationFormChange(patch)} />
					</div>
					{locationDiffs && (locationDiffs.coords || locationDiffs.city || locationDiffs.address) && (
						<div className="border rounded-lg px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 space-y-0.5">
							<p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-1">{t("diff.locationChanged")}</p>
							{locationDiffs.coords && currentStation?.location && (
								<ChangeBadge
									label={t("diff.coordinates")}
									current={`${currentStation.location.latitude.toFixed(6)}, ${currentStation.location.longitude.toFixed(6)}`}
								/>
							)}
							{locationDiffs.city && currentStation?.location && <ChangeBadge label={t("diff.city")} current={currentStation.location.city || "—"} />}
							{locationDiffs.address && currentStation?.location && (
								<ChangeBadge label={t("diff.address")} current={currentStation.location.address || "—"} />
							)}
						</div>
					)}
				</>
			)}
		</>
	);
}
