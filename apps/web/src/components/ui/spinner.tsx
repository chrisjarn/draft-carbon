import { Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
	return (
		<HugeiconsIcon
			icon={Loading01Icon}
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
		/>
	);
}

export { Spinner };
