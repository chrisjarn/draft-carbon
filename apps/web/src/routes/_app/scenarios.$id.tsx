import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/scenarios/$id")({
	loader: ({ context: { trpc, queryClient } }) => {
		void queryClient.ensureQueryData(trpc.entities.getAll.queryOptions());
	},
});
