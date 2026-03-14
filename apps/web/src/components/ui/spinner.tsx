import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			aria-label="Loading"
			role="status"
			className={cn("animate-spin", className)}
		/>
	);
}

export { Spinner };
