import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/fy-planning")({
	component: FyPlanningPage,
});

function FyPlanningPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">FY Reports</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					Financial year revenue targets vs actuals across entities and states
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<CalendarDays className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Multi-year revenue comparison table with import from prior year, export
						to CSV and drill-down by state and service line.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
