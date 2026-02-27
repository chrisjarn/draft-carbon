import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/carbonites")({
	component: CarbonitesPage,
});

function CarbonitesPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">Carbonites</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					Staff directory — searchable and filterable by state, service line, office and pod
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<Users className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Staff directory with filterable table, inline detail panel and full CRUD
						for admin and manager roles.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
