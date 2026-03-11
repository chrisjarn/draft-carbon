import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlertItem } from "./types";

/* ─── Alerts Panel ─────────────────────────────────────────────────────── */

interface AlertsPanelProps {
	data: AlertItem[] | undefined;
	loading: boolean;
}

export function AlertsPanel({ data, loading }: AlertsPanelProps) {
	if (loading || !data || data.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Alerts</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{data.map((alert) => (
					<Link
						key={`${alert.type}-${alert.title}`}
						to={alert.link}
						className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 transition-colors hover:border-yellow-500/40"
					>
						<HugeiconsIcon
							icon={Alert02Icon}
							className="mt-0.5 size-4 shrink-0 text-yellow-500"
						/>
						<div className="min-w-0">
							<div className="font-medium text-base">{alert.title}</div>
							<div className="text-muted-foreground text-sm">
								{alert.message}
							</div>
						</div>
					</Link>
				))}
			</CardContent>
		</Card>
	);
}
