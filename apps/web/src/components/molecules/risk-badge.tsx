import { Badge } from "@/components/ui/badge";

const RISK_VARIANTS: Record<string, "error" | "warning" | "success"> = {
	high: "error",
	medium: "warning",
	low: "success",
};

export function RiskBadge({ level }: { level: string | null }) {
	if (!level) return <span className="text-muted-foreground text-sm">—</span>;
	const variant = RISK_VARIANTS[level.toLowerCase()] ?? "secondary";
	return (
		<Badge variant={variant} size="sm" className="capitalize">
			{level}
		</Badge>
	);
}
