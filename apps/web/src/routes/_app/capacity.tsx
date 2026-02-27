import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/capacity")({
	component: CapacityPage,
});

function CapacityPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">Capacity Plan</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					Pod capacity and budget tracking across states and offices
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<Target className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Capacity plan view will show pod budgets, headcount and utilisation
						indicators (green / amber / red) per service line and office.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
