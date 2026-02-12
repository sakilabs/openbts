import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { AirportTowerIcon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOperatorColor } from "@/lib/operatorUtils";
import { LocationPicker } from "@/features/submissions/components/locationPicker";
import type { ProposedLocationForm } from "@/features/submissions/types";
import type { Operator } from "@/types/station";

type StationInfoFormProps = {
	stationId: string;
	onStationIdChange: (value: string) => void;
	operatorId: number | null;
	onOperatorIdChange: (value: number | null) => void;
	notes: string;
	onNotesChange: (value: string) => void;
	isConfirmed: boolean;
	onIsConfirmedChange: (checked: boolean) => void;
	location: ProposedLocationForm;
	onLocationChange: (patch: Partial<ProposedLocationForm>) => void;
	operators: Operator[];
	selectedOperator?: Operator;
};

export function StationInfoForm({
	stationId,
	onStationIdChange,
	operatorId,
	onOperatorIdChange,
	notes,
	onNotesChange,
	isConfirmed,
	onIsConfirmedChange,
	location,
	onLocationChange,
	operators,
	selectedOperator,
}: StationInfoFormProps) {
	const { t } = useTranslation(["submissions", "common"]);

	return (
		<div className="space-y-3">
			<div className="border rounded-xl overflow-hidden">
				<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
					<HugeiconsIcon icon={AirportTowerIcon} className="size-4 text-primary" />
					<span className="font-semibold text-sm">{t("stationInfo.title")}</span>
				</div>
				<div className="px-4 py-3 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("common:labels.stationId")}</Label>
							<Input value={stationId} onChange={(e) => onStationIdChange(e.target.value)} maxLength={16} />
						</div>
						<div className="space-y-2">
							<Label>{t("common:labels.operator")}</Label>
							<Select
								value={operatorId !== null ? operatorId.toString() : ""}
								onValueChange={(v) => onOperatorIdChange(v ? Number.parseInt(v, 10) : null)}
							>
								<SelectTrigger>
									<SelectValue>
										{selectedOperator ? (
											<div className="flex items-center gap-2">
												<div className="size-2.5 rounded-full" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc) }} />
												{selectedOperator.name}
											</div>
										) : (
											t("common:placeholder.selectOperator")
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
						</div>
					</div>
					<div className="space-y-2">
						<Label>{t("common:labels.notes")}</Label>
						<Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} />
					</div>
					<div className="flex items-center gap-2">
						<Checkbox checked={isConfirmed} onCheckedChange={(checked) => onIsConfirmedChange(checked === true)} />
						<Label>{t("common:labels.confirmed")}</Label>
					</div>
				</div>
			</div>

			<LocationPicker location={location} onLocationChange={onLocationChange} />
		</div>
	);
}
