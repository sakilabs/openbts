import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Loading01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reverseGeocode, fetchRegions } from "../api";
import type { ProposedLocationForm } from "../types";
import type { LocationErrors } from "../utils/validation";

type LocationPickerProps = {
	location: ProposedLocationForm;
	errors?: LocationErrors;
	onLocationChange: (patch: Partial<ProposedLocationForm>) => void;
};

export function LocationPicker({ location, errors, onLocationChange }: LocationPickerProps) {
	const { t } = useTranslation("submissions");
	const [isFetchingAddress, setIsFetchingAddress] = useState(false);

	const { data: regions = [] } = useQuery({
		queryKey: ["regions"],
		queryFn: fetchRegions,
		staleTime: 1000 * 60 * 30,
	});

	const handleFetchAddress = async () => {
		if (location.latitude === null || location.longitude === null) return;

		const lat = location.latitude;
		const lon = location.longitude;
		setIsFetchingAddress(true);

		try {
			const result = await reverseGeocode(lat, lon);

			if (result) {
				const city = result.address.city || result.address.town || result.address.village || result.address.municipality;
				const addressParts = [result.address.road, result.address.house_number].filter(Boolean);
				const address = addressParts.join(" ") || result.display_name?.split(",")[0];

				const regionName = result.address.state?.replace(" Voivodeship", "").replace("województwo ", "");
				const matchedRegion = regions.find((r) => r.name.toLowerCase() === regionName?.toLowerCase());

				const patch: Partial<ProposedLocationForm> = {};
				if (city) patch.city = city;
				if (address) patch.address = address;
				if (matchedRegion) patch.region_id = matchedRegion.id;

				onLocationChange(patch);
			}
		} finally {
			setIsFetchingAddress(false);
		}
	};

	const hasCoordinates = location.latitude !== null && location.longitude !== null;

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
				<HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
				<span className="font-semibold text-sm">{t("locationPicker.title")}</span>
			</div>

			<div className="p-4 space-y-4">
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleFetchAddress}
						disabled={!hasCoordinates || isFetchingAddress}
						className="h-8 text-xs"
					>
						{isFetchingAddress ? (
							<HugeiconsIcon icon={Loading01Icon} className="size-3.5 animate-spin" />
						) : (
							<HugeiconsIcon icon={Location01Icon} className="size-3.5" />
						)}
						{t("locationPicker.fetchAddress")}
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="latitude" className="text-xs">
							{t("locationPicker.latitude")}
						</Label>
						<Input
							id="latitude"
							type="number"
							step="any"
							placeholder="52.2297"
							value={location.latitude ?? ""}
							onChange={(e) => onLocationChange({ latitude: e.target.value ? Number.parseFloat(e.target.value) : null })}
							className={`h-8 font-mono text-sm ${errors?.latitude ? "border-destructive" : ""}`}
						/>
						{errors?.latitude && <p className="text-xs text-destructive">{t(errors.latitude)}</p>}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="longitude" className="text-xs">
							{t("locationPicker.longitude")}
						</Label>
						<Input
							id="longitude"
							type="number"
							step="any"
							placeholder="21.0122"
							value={location.longitude ?? ""}
							onChange={(e) => onLocationChange({ longitude: e.target.value ? Number.parseFloat(e.target.value) : null })}
							className={`h-8 font-mono text-sm ${errors?.longitude ? "border-destructive" : ""}`}
						/>
						{errors?.longitude && <p className="text-xs text-destructive">{t(errors.longitude)}</p>}
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="region" className="text-xs">
						{t("locationPicker.region")}
					</Label>
					<Select
						value={location.region_id?.toString() ?? ""}
						onValueChange={(value) => onLocationChange({ region_id: value ? Number.parseInt(value, 10) : null })}
					>
						<SelectTrigger className={`h-8 text-sm ${errors?.region_id ? "border-destructive" : ""}`}>
							<SelectValue>
								{location.region_id ? regions.find((r) => r.id === location.region_id)?.name : t("locationPicker.selectRegion")}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{regions.map((region) => (
								<SelectItem key={region.id} value={region.id.toString()}>
									{region.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors?.region_id && <p className="text-xs text-destructive">{t(errors.region_id)}</p>}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="city" className="text-xs">
							{t("locationPicker.city")}
						</Label>
						<Input
							id="city"
							placeholder={t("locationPicker.cityPlaceholder")}
							value={location.city ?? ""}
							onChange={(e) => onLocationChange({ city: e.target.value })}
							className="h-8 text-sm"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="address" className="text-xs">
							{t("locationPicker.address")}
						</Label>
						<Input
							id="address"
							placeholder={t("locationPicker.addressPlaceholder")}
							value={location.address ?? ""}
							onChange={(e) => onLocationChange({ address: e.target.value })}
							className="h-8 text-sm"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
