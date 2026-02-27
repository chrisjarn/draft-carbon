import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/hiring")({
	component: HiringPage,
});

function HiringPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">Hiring</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					Hiring pipeline — open roles, salary brackets and cost projections
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<Briefcase className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Hiring pipeline table with salary brackets reference, time-to-hire guide
						and cost projection. Full CRUD for open and closed roles.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
