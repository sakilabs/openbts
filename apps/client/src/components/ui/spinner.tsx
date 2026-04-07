import { LoadingIcon } from "@/components/ui/loading-icon";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return <LoadingIcon role="status" aria-label="Loading" className={cn("size-4", className)} {...props} />;
}

export { Spinner };
