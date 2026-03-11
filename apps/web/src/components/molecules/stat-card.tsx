import { ArrowDown02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
	label: string;
	value: string | number;
	loading?: boolean;
	subtitle?: string;
	subtitleClass?: string;
	trend?: { value: string; positive: boolean };
}

export function StatCard({
	label,
	value,
	loading,
	subtitle,
	subtitleClass,
	trend,
}: StatCardProps) {
	return (
		<Card className="flex flex-col gap-1 p-4">
			<span className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
				{label}
			</span>
			{loading ? (
				<>
					<Skeleton className="h-8 w-24" />
					<Skeleton className="mt-0.5 h-3.5 w-16" />
				</>
			) : (
				<>
					<span className="font-bold text-2xl tabular-nums tracking-tight">
						{value}
					</span>
					{trend && (
						<span
							className={`inline-flex items-center gap-0.5 text-xs ${trend.positive ? "text-green-500" : "text-red-500"}`}
						>
							<HugeiconsIcon
								icon={trend.positive ? ArrowUp02Icon : ArrowDown02Icon}
								className="size-3"
								aria-hidden="true"
							/>
							{trend.value}
						</span>
					)}
					{subtitle && (
						<span
							className={`text-xs ${subtitleClass ?? "text-muted-foreground"}`}
						>
							{subtitle}
						</span>
					)}
				</>
			)}
		</Card>
	);
}
