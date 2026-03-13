import { Badge } from "@/components/ui/badge";

const PERF_VARIANTS: Record<
	string,
	"success" | "default" | "error" | "secondary"
> = {
	exceeds: "success",
	meets: "secondary",
	below: "error",
};

export function PerfBadge({ rating }: { rating: string | null }) {
	if (!rating) return <span className="text-text-soft-400 text-sm">—</span>;
	const variant = PERF_VARIANTS[rating.toLowerCase()] ?? "secondary";
	return (
		<Badge variant={variant} size="sm" className="capitalize">
			{rating}
		</Badge>
	);
}
