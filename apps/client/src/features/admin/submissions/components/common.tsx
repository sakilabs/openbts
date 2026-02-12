export function ChangeBadge({ label, current }: { label: string; current: string }) {
	return (
		<div className="flex items-center gap-1.5 mt-1 text-[11px]">
			<span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
			<span className="text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">{label}:</span>
			<span className="font-mono text-muted-foreground break-all">{current || "—"}</span>
		</div>
	);
}
