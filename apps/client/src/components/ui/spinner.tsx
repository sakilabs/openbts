import { cn } from "@/lib/utils";
import { LoadingIcon } from "@/components/ui/loadingIcon";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return <LoadingIcon role="status" aria-label="Loading" className={cn("size-4", className)} {...props} />;
}

export { Spinner };
