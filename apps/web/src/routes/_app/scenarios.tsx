import { createFileRoute } from "@tanstack/react-router";

type ScenariosSearch = {
	entity?: string;
	fy?: string;
};

export const Route = createFileRoute("/_app/scenarios")({
	validateSearch: (search: Record<string, unknown>): ScenariosSearch => ({
		entity: typeof search.entity === "string" ? search.entity : undefined,
		fy: typeof search.fy === "string" ? search.fy : undefined,
	}),
	loader: ({ context: { trpc, queryClient } }) => {
		void queryClient.ensureQueryData(trpc.entities.getAll.queryOptions());
	},
});
