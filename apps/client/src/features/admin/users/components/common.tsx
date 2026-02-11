import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

export function SectionHeader({ icon, title, description }: { icon: IconSvgElement; title: string; description?: string }) {
	return (
		<div className="flex items-start gap-3 mb-4">
			<div className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
				<HugeiconsIcon icon={icon} className="size-4.5" />
			</div>
			<div className="min-w-0">
				<h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
				{description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
			</div>
		</div>
	);
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2">
			<span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{label}</span>
			<span className="text-sm">{children}</span>
		</div>
	);
}
