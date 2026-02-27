import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/wfp")({
	component: WfpPage,
});

function WfpPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">Workforce Planning</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					Billing targets, performance ratings, promotions and scenario planning per entity
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<TrendingUp className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Entity-scoped WFP view with team structure, revenue targets, compensation
						budget summary, attrition risk register and scenario workbench.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
