import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
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
import { getOperatorColor } from "@/lib/operatorUtils";
import { useDeleteStationMutation } from "@/features/admin/stations/mutations";
import type { Operator, Station } from "@/types/station";

type StationDetailHeaderProps = {
	station?: Station;
	stationId: string;
	isCreateMode: boolean;
	selectedOperator?: Operator;
	isSaving: boolean;
	onSave: () => void;
	onRevert: () => void;
};

export function StationDetailHeader({ station, stationId, isCreateMode, selectedOperator, isSaving, onSave, onRevert }: StationDetailHeaderProps) {
	const { t } = useTranslation(["stations", "common"]);
	const navigate = useNavigate();
	const deleteMutation = useDeleteStationMutation();

	const handleDelete = () => {
		if (!station) return;
		deleteMutation.mutate(station.id, {
			onSuccess: () => {
				toast.success(t("toast.deleted"));
				navigate({ to: "/admin/stations" });
			},
			onError: () => {
				toast.error(t("common:error.toast"));
			},
		});
	};

	return (
		<div
			className="shrink-0 border-b bg-background/90 backdrop-blur-md px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-sm transition-all"
			style={{
				borderTopWidth: "3px",
				borderTopColor: selectedOperator ? getOperatorColor(selectedOperator.mnc) : "transparent",
			}}
		>
			<div className="flex items-center">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => window.history.back()}
					className="text-muted-foreground hover:text-foreground gap-2 pl-1 pr-3 -ml-2 hover:bg-muted/50 transition-colors"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					<span className="font-medium">{t("common:actions.back")}</span>
				</Button>
			</div>

			<div className="flex items-center justify-center flex-1 min-w-0 mx-2 md:mx-4">
				<div className="flex items-center gap-2.5 px-3 py-1.5 bg-secondary/30 rounded-full border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-w-full overflow-hidden group transition-colors">
					{selectedOperator && (
						<div className="relative flex items-center justify-center shrink-0">
							<div className="size-2.5 rounded-full relative z-10" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc) }} />
						</div>
					)}
					<span className="font-bold text-sm text-foreground tracking-tight truncate min-w-0">
						{isCreateMode ? t("common:labels.newStation") : station?.operator.name}
					</span>
					<div className="w-px h-3.5 bg-border/60 shrink-0" />
					<span className="text-xs font-mono text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded border border-border/20 shadow-sm shrink-0">
						{isCreateMode ? stationId || "—" : station?.station_id}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{!isCreateMode && station && (
					<AlertDialog>
						<AlertDialogTrigger
							render={<Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" />}
						>
							{t("header.deleteStation")}
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("header.confirmDelete")}</AlertDialogTitle>
								<AlertDialogDescription>{t("header.confirmDeleteDesc")}</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
								<AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
									{deleteMutation.isPending ? <Spinner /> : t("header.deleteStation")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
				<Button
					variant="ghost"
					size="sm"
					onClick={onRevert}
					className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
				>
					{isCreateMode ? t("common:actions.clear") : t("common:actions.revert")}
				</Button>
				<Button size="sm" onClick={onSave} disabled={isSaving} className="shadow-sm font-medium px-4 min-w-25">
					{isSaving ? <Spinner /> : isCreateMode ? t("header.createStation") : t("common:actions.saveChanges")}
				</Button>
			</div>
		</div>
	);
}
