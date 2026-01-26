import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Copy01Icon } from "@hugeicons/core-free-icons";

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button type="button" onClick={handleCopy} className="p-1 hover:bg-muted rounded transition-colors" title="Copy to clipboard">
			{copied ? (
				<HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-emerald-500" />
			) : (
				<HugeiconsIcon icon={Copy01Icon} className="size-3.5 text-muted-foreground" />
			)}
		</button>
	);
}
