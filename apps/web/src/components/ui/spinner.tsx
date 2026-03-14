import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
	return (
		<div
			role="status"
			aria-label="Loading"
			className={cn(
				"animate-spin rounded-full border-2 border-current border-t-transparent",
				className ?? "size-4",
			)}
		/>
	);
}

export { Spinner };
