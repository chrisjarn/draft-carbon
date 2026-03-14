import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin")({
	beforeLoad: ({ context }) => {
		// Session is already cached by _app beforeLoad — use it directly
		const session = (context as { session?: { user?: { role?: string } } })
			.session;
		const role = session?.user?.role;
		if (role !== "admin") throw redirect({ to: "/dashboard" });
	},
	loader: ({ context: { trpc, queryClient } }) => {
		void queryClient.ensureQueryData(trpc.admin.listUsers.queryOptions());
		void queryClient.ensureQueryData(trpc.entities.getAll.queryOptions());
	},
});
