import { createFileRoute, redirect } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/admin")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		const role = (session.data?.user as { role?: string })?.role;
		if (role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: AdminPage,
});

function AdminPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">Admin</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					User management — roles, invitations and access control
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<Settings className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Admin panel for managing user roles, inviting new users and reviewing
						access logs. Restricted to admin role only.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
