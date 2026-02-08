"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share08Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type ShareButtonProps = {
	title?: string;
	text?: string;
	url?: string;
	size?: "sm" | "md";
	className?: string;
};

export function ShareButton({ title, text, url, size = "sm", className }: ShareButtonProps) {
	const { t } = useTranslation("stationDetails");
	const [copied, setCopied] = useState(false);
	const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

	const handleShare = useCallback(async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: title ?? document.title,
					text,
					url: shareUrl,
				});
				return;
			} catch (error) {
				if ((error as Error).name === "AbortError") return;
			}
		}

		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	}, [title, text, shareUrl]);

	const iconSize = size === "sm" ? "size-3.5" : "size-4";
	const buttonPadding = size === "sm" ? "p-1" : "p-1.5";

	return (
		<Tooltip>
			<TooltipTrigger onClick={handleShare} className={`${buttonPadding} hover:bg-muted rounded transition-colors cursor-pointer ${className ?? ""}`}>
				{copied ? (
					<HugeiconsIcon icon={Tick02Icon} className={`${iconSize} text-emerald-500`} />
				) : (
					<HugeiconsIcon icon={Share08Icon} className={`${iconSize} text-muted-foreground`} />
				)}
			</TooltipTrigger>
			<TooltipContent>{copied ? t("share.copied") : t("share.share")}</TooltipContent>
		</Tooltip>
	);
}
