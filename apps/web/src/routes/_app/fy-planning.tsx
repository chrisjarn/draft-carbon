import { createFileRoute } from "@tanstack/react-router";

type FyPlanningSearch = {
	fy?: string;
};

export const Route = createFileRoute("/_app/fy-planning")({
	validateSearch: (search: Record<string, unknown>): FyPlanningSearch => ({
		fy: typeof search.fy === "string" ? search.fy : undefined,
	}),
	loader: ({ context: { trpc, queryClient } }) => {
		void queryClient.ensureQueryData(trpc.podBudgets.getAll.queryOptions());
		// Default FY — wfp.getRevenue uses search param, but we prefetch the default
		void queryClient.ensureQueryData(
			trpc.wfp.getRevenue.queryOptions({ fy: "FY25-26" }),
		);
	},
});
