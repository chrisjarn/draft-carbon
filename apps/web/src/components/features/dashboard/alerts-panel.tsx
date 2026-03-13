import {
	Alert02Icon,
	AlertCircleIcon,
	InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AlertItem } from "./types";

/* ─── Severity config ───────────────────────────────────────────────────── */

const severityConfig: Record<
	AlertItem["severity"],
	{
		border: string;
		bg: string;
		icon: typeof Alert02Icon;
		iconColor: string;
	}
> = {
	error: {
		border: "border-red-500/20",
		bg: "bg-red-500/5",
		icon: Alert02Icon,
		iconColor: "text-red-500",
	},
	warning: {
		border: "border-amber-500/20",
		bg: "bg-amber-500/5",
		icon: AlertCircleIcon,
		iconColor: "text-amber-500",
	},
	info: {
		border: "border-blue-500/20",
		bg: "bg-blue-500/5",
		icon: InformationCircleIcon,
		iconColor: "text-blue-500",
	},
};

/* ─── Alerts Panel ─────────────────────────────────────────────────────── */

interface AlertsPanelProps {
	data: AlertItem[] | undefined;
	loading: boolean;
}

export function AlertsPanel({ data, loading }: AlertsPanelProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-14 w-full rounded-lg" />
					<Skeleton className="h-14 w-full rounded-lg" />
					<Skeleton className="h-14 w-full rounded-lg" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) return null;

	const urgentCount = data.filter((a) => a.severity === "error").length;

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle className="text-balance text-base">
					Needs Attention
				</CardTitle>
				{urgentCount > 0 && <Badge variant="error">{urgentCount}</Badge>}
			</CardHeader>
			<CardContent className="space-y-3">
				{data.map((alert) => {
					const config = severityConfig[alert.severity];
					return (
						<Link
							key={`${alert.type}-${alert.title}`}
							to={alert.link}
							className={cn(
								"flex items-start gap-3 rounded-lg border p-4 transition-colors hover:opacity-90",
								config.border,
								config.bg,
							)}
						>
							<HugeiconsIcon
								icon={config.icon}
								className={cn("mt-0.5 size-4 shrink-0", config.iconColor)}
							/>
							<div className="min-w-0">
								<div className="text-balance font-medium text-sm">
									{alert.title}
								</div>
								<div className="text-pretty text-sm text-text-soft-400">
									{alert.message}
								</div>
							</div>
						</Link>
					);
				})}
			</CardContent>
		</Card>
	);
}
