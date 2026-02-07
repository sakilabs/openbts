import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Combobox,
	ComboboxChips,
	ComboboxChip,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

import { fetchOperators, fetchBands } from "@/features/map/search-api";
import { fetchApiData, API_BASE } from "@/lib/api";
import { cn, toggleValue } from "@/lib/utils";
import { getOperatorColor } from "@/lib/operator-utils";
import type { Operator, Region } from "@/types/station";
import type { RouteHandle } from "./_layout";

const fetchRegions = () => fetchApiData<Region[]>("regions");

const RAT_OPTIONS = [
	{ value: "GSM", label: "GSM", gen: "2G" },
	{ value: "UMTS", label: "UMTS", gen: "3G" },
	{ value: "LTE", label: "LTE", gen: "4G" },
	{ value: "NR", label: "NR", gen: "5G" },
	{ value: "IOT", label: "IoT", gen: "NB" },
] as const;

const FORMAT_OPTIONS = [
	{ value: "2.0", label: "CLF v2.0" },
	{ value: "2.1", label: "CLF v2.1" },
	{ value: "3.0-dec", label: "CLF v3.0 (dec)" },
	{ value: "3.0-hex", label: "CLF v3.0 (hex)" },
	{ value: "4.0", label: "CLF v4.0" },
	{ value: "ntm", label: "NetMonster (.ntm)" },
	{ value: "netmonitor", label: "Netmonitor (.csv)" },
] as const;

type FormValues = {
	operators: number[];
	regions: string[];
	rat: string[];
	bands: number[];
	format: "2.0" | "2.1" | "3.0-dec" | "3.0-hex" | "4.0" | "ntm" | "netmonitor";
};

const INITIAL_VALUES: FormValues = {
	operators: [],
	regions: [],
	rat: [],
	bands: [],
	format: "4.0",
};

export const handle: RouteHandle = {
	titleKey: "items.clfExport",
	i18nNamespace: "nav",
};

export default function ClfExportPage() {
	const { t } = useTranslation("clfExport");
	const { t: tCommon } = useTranslation("common");

	const { data: operators = [] } = useQuery({
		queryKey: ["operators"],
		queryFn: fetchOperators,
		staleTime: 1000 * 60 * 30,
	});

	const { data: regions = [] } = useQuery({
		queryKey: ["regions"],
		queryFn: fetchRegions,
		staleTime: 1000 * 60 * 30,
	});

	const { data: bands = [] } = useQuery({
		queryKey: ["bands"],
		queryFn: fetchBands,
		staleTime: 1000 * 60 * 30,
	});

	const uniqueBandValues = [...new Set(bands.map((b) => b.value))].sort((a, b) => a - b);

	const operatorChipsRef = useRef<HTMLDivElement>(null);

	const form = useForm({
		defaultValues: INITIAL_VALUES,
		onSubmit: async ({ value }) => {
			const params = new URLSearchParams();
			params.set("format", value.format);
			if (value.operators.length > 0) params.set("operators", value.operators.join(","));
			if (value.regions.length > 0) params.set("regions", value.regions.join(","));
			if (value.rat.length > 0) params.set("rat", value.rat.join(","));
			if (value.bands.length > 0) params.set("bands", value.bands.join(","));

			const url = `${API_BASE}/cells/export?${params.toString()}`;

			try {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`Export failed: ${response.status}`);
				}

				const blob = await response.blob();
				const downloadUrl = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = downloadUrl;
				const fileExtension = value.format === "ntm" ? "ntm" : value.format === "netmonitor" ? "csv" : "clf";
				link.download = `cells_export_${value.format}.${fileExtension}`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(downloadUrl);

				toast.success(t("exportSuccess"));
			} catch (error) {
				toast.error(t("exportError"));
				console.error("Export error:", error);
			}
		},
	});

	return (
		<main className="flex-1 overflow-y-auto p-4">
			<div className="max-w-4xl space-y-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{t("page.title")}</h1>
					<p className="text-muted-foreground text-sm">{t("page.description")}</p>
				</div>

				<div className="border rounded-xl p-4 bg-muted/20 space-y-2">
					<h3 className="font-medium text-sm">{t("info.appsTitle")}</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<h4 className="font-medium text-muted-foreground">Android</h4>
							<ul className="list-disc list-inside text-muted-foreground">
								<li>Netmonitor (CLF v2.0, v2.1, v3.0, .csv)</li>
								<li>G-MoN (CLF v4.0)</li>
								<li>NetMonster (.ntm)</li>
							</ul>
						</div>
						<div>
							<h4 className="font-medium text-muted-foreground">Symbian</h4>
							<ul className="list-disc list-inside text-muted-foreground">
								<li>CellTrack (CLF v2.0, v3.0)</li>
								<li>PyMoNony (CLF v3.0)</li>
							</ul>
						</div>
					</div>
					<p className="text-sm font-small text-muted-foreground">{t("info.iosNote")}</p>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-6"
				>
					<div className="space-y-2">
						<Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("form.operators")}</Label>
						<form.Field name="operators">
							{(field) => (
								<Combobox
									multiple
									value={field.state.value.map((mnc) => operators.find((op) => op.mnc === mnc)).filter(Boolean) as Operator[]}
									onValueChange={(values) => field.handleChange(values.map((v) => v.mnc))}
									items={operators}
								>
									<ComboboxChips ref={operatorChipsRef} className="min-h-10 max-h-24 overflow-y-auto text-base md:text-sm">
										{field.state.value.map((mnc) => {
											const operator = operators.find((op) => op.mnc === mnc);
											return operator ? (
												<ComboboxChip key={mnc}>
													<div className="size-2 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(mnc) }} />
													{operator.name}
												</ComboboxChip>
											) : null;
										})}
										<ComboboxChipsInput
											className="text-base md:text-sm"
											placeholder={field.state.value.length === 0 ? t("form.selectOperators") : ""}
										/>
									</ComboboxChips>
									<ComboboxContent anchor={operatorChipsRef}>
										<ComboboxList>
											<ComboboxEmpty>{t("form.noOperatorsFound")}</ComboboxEmpty>
											{operators.map((operator) => (
												<ComboboxItem key={operator.mnc} value={operator}>
													<div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(operator.mnc) }} />
													<span>{operator.name}</span>
													<span className="text-muted-foreground text-xs ml-auto">{operator.mnc}</span>
												</ComboboxItem>
											))}
										</ComboboxList>
									</ComboboxContent>
								</Combobox>
							)}
						</form.Field>
						<p className="text-xs text-muted-foreground">{t("form.operatorsHint")}</p>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("form.regions")}</Label>
						<form.Field name="regions">
							{(field) => (
								<div className="flex flex-wrap gap-x-4 gap-y-1">
									{regions.map((region) => (
										<label
											htmlFor={`region-${region.code}`}
											key={region.code}
											className={cn(
												"flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm",
												field.state.value.includes(region.code) ? "bg-primary/10" : "hover:bg-muted",
											)}
										>
											<Checkbox
												id={`region-${region.code}`}
												checked={field.state.value.includes(region.code)}
												onCheckedChange={() => field.handleChange(toggleValue(field.state.value, region.code))}
											/>
											<span className="truncate">{region.name}</span>
										</label>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("form.standard")}</Label>
						<p className="text-xs text-muted-foreground">{t("form.standardHint")}</p>
						<form.Field name="rat">
							{(field) => (
								<div className="flex flex-wrap gap-x-4 gap-y-1">
									{RAT_OPTIONS.map((rat) => (
										<label
											htmlFor={`rat-${rat.value}`}
											key={rat.value}
											className={cn(
												"flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm",
												field.state.value.includes(rat.value) ? "bg-primary/10" : "hover:bg-muted",
											)}
										>
											<Checkbox
												id={`rat-${rat.value}`}
												checked={field.state.value.includes(rat.value)}
												onCheckedChange={() => field.handleChange(toggleValue(field.state.value, rat.value))}
											/>
											<span className="text-[10px] text-muted-foreground font-mono">{rat.gen}</span>
											<span>{rat.label}</span>
										</label>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("form.bands")}</Label>
						<p className="text-xs text-muted-foreground">{t("form.bandsHint")}</p>
						<form.Field name="bands">
							{(field) => (
								<div className="flex flex-wrap gap-x-4 gap-y-1">
									{uniqueBandValues.map((band) => (
										<label
											htmlFor={`band-${band}`}
											key={band}
											className={cn(
												"flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm",
												field.state.value.includes(band) ? "bg-primary/10" : "hover:bg-muted",
											)}
										>
											<Checkbox
												id={`band-${band}`}
												checked={field.state.value.includes(band)}
												onCheckedChange={() => field.handleChange(toggleValue(field.state.value, band))}
											/>
											<span className="font-mono">{band}</span>
										</label>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("form.outputFormat")}</Label>
						<form.Field name="format">
							{(field) => (
								<RadioGroup
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value as FormValues["format"])}
									className="flex flex-wrap gap-x-4 gap-y-1"
								>
									{FORMAT_OPTIONS.map((format) => (
										<label
											htmlFor={`format-${format.value}`}
											key={format.value}
											className={cn(
												"flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm",
												field.state.value === format.value ? "bg-primary/10" : "hover:bg-muted",
											)}
										>
											<RadioGroupItem id={`format-${format.value}`} value={format.value} />
											<span>{format.label}</span>
										</label>
									))}
								</RadioGroup>
							)}
						</form.Field>
					</div>

					<Separator />

					<div className="text-sm text-muted-foreground">
						{t("form.formatInfo")}{" "}
						<a href="http://www.afischer-online.de/sos/celltrack/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
							2.x, 3.x
						</a>
						{", "}
						<a href="https://sites.google.com/site/clfgmon/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
							4.0
						</a>
						{", "}
						<a href="https://netmonster.app/#docs-user-about-ntm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
							NetMonster
						</a>{" "}
						{tCommon("and")}{" "}
						<a
							href="https://netmonitor.ing/docs/cell-database-default/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							Netmonitor
						</a>
					</div>

					<form.Subscribe selector={(s) => ({ isSubmitting: s.isSubmitting })}>
						{({ isSubmitting }) => (
							<Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto">
								{isSubmitting ? (
									<>
										<Spinner data-icon="inline-start" />
										{t("form.exporting")}
									</>
								) : (
									<>
										<HugeiconsIcon icon={Download04Icon} className="size-4" data-icon="inline-start" />
										{t("form.export")}
									</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</div>
		</main>
	);
}
