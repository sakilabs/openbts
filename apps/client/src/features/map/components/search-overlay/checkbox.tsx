import { cn } from "@/lib/utils";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";

type CheckboxProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	children?: React.ReactNode;
	className?: string;
};

export function Checkbox({ checked, onChange, children, className }: CheckboxProps) {
	return (
		<button
			type="button"
			className={cn(
				"flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all cursor-pointer",
				"hover:bg-accent",
				checked && "bg-primary/10",
				className,
			)}
			onClick={() => onChange(!checked)}
		>
			<ShadcnCheckbox checked={checked} onCheckedChange={onChange} onClick={(e) => e.stopPropagation()} />
			{children}
		</button>
	);
}
