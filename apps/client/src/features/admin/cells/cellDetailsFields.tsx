import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CellDetailsFieldsProps = {
	rat: string;
	details: Record<string, unknown>;
	detailErrors?: Record<string, string>;
	disabled?: boolean;
	onDetailChange: (field: string, value: number | boolean | undefined) => void;
};

export function CellDetailsFields({ rat, details, detailErrors, disabled, onDetailChange }: CellDetailsFieldsProps) {
	const renderInput = (field: string, placeholder: string) => (
		<td className="px-2 py-1">
			<Input
				type="number"
				min={0}
				placeholder={placeholder}
				value={(details[field] as number) ?? ""}
				onChange={(e) => onDetailChange(field, e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
				className={cn("h-7 w-24 font-mono text-sm", detailErrors?.[field] && "border-destructive")}
				disabled={disabled}
			/>
		</td>
	);

	const renderComputed = (value: number | null) => (
		<td className="px-2 py-1">
			<span className="font-mono text-sm text-muted-foreground">{value !== null ? value : "-"}</span>
		</td>
	);

	const d = details;
	switch (rat) {
		case "GSM":
			return (
				<>
					{renderInput("lac", "LAC")}
					{renderInput("cid", "CID")}
					<td className="px-2 py-1">
						<Checkbox
							checked={(d.e_gsm as boolean) ?? false}
							onCheckedChange={(checked) => onDetailChange("e_gsm", checked === true)}
							disabled={disabled}
						/>
					</td>
				</>
			);
		case "UMTS": {
			const longCid =
				d.rnc !== undefined && d.cid !== undefined ? (d.rnc as number) * 65536 + (d.cid as number) : null;
			return (
				<>
					{renderInput("lac", "LAC")}
					{renderInput("rnc", "RNC")}
					{renderInput("cid", "CID")}
					{renderComputed(longCid)}
					{renderInput("carrier", "Carrier")}
				</>
			);
		}
		case "LTE": {
			const eCid =
				d.enbid !== undefined && d.clid !== undefined ? (d.enbid as number) * 256 + (d.clid as number) : null;
			return (
				<>
					{renderInput("tac", "TAC")}
					{renderInput("enbid", "eNBID")}
					{renderInput("clid", "CLID")}
					{renderComputed(eCid)}
					<td className="px-2 py-1">
						<Checkbox
							checked={(d.supports_nb_iot as boolean) ?? false}
							onCheckedChange={(checked) => onDetailChange("supports_nb_iot", checked === true)}
							disabled={disabled}
						/>
					</td>
				</>
			);
		}
		case "NR": {
			const nci =
				d.gnbid !== undefined && d.clid !== undefined ? (d.gnbid as number) * 4096 + (d.clid as number) : null;
			return (
				<>
					{renderInput("nrtac", "TAC")}
					{renderInput("gnbid", "gNBID")}
					{renderInput("clid", "CLID")}
					{renderComputed(nci)}
					{renderInput("pci", "PCI")}
					<td className="px-2 py-1">
						<Checkbox
							checked={(d.supports_nr_redcap as boolean) ?? false}
							onCheckedChange={(checked) => onDetailChange("supports_nr_redcap", checked === true)}
							disabled={disabled}
						/>
					</td>
				</>
			);
		}
		default:
			return null;
	}
}
