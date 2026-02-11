import { cn } from "@/lib/utils";
import { LoadingIcon } from "@/components/ui/loading-icon";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return <LoadingIcon role="status" aria-label="Loading" className={cn("size-4", className)} {...props} />;
}

export { Spinner };
