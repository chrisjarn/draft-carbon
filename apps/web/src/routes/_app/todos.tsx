import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/todos")({
	loader: ({ context: { trpc, queryClient } }) => {
		void queryClient.ensureQueryData(trpc.todo.getAll.queryOptions());
	},
});
