import { createFileRoute } from "@tanstack/react-router";

type CapacityPlanSearch = {
	entity?: string;
	fy?: string;
	tab?: "firm" | "staff" | "pod-budgets";
};

export const Route = createFileRoute("/_app/capacity-plan")({
	validateSearch: (search: Record<string, unknown>): CapacityPlanSearch => ({
		entity: typeof search.entity === "string" ? search.entity : undefined,
		fy: typeof search.fy === "string" ? search.fy : undefined,
		tab:
			search.tab === "firm" ||
			search.tab === "staff" ||
			search.tab === "pod-budgets"
				? search.tab
				: undefined,
	}),
	loader: ({ context: { trpc, queryClient } }) => {
		// Main entity list — needed before any tab renders
		void queryClient.ensureQueryData(trpc.entities.getAll.queryOptions());
		// Firm tab KPIs (default tab)
		void queryClient.ensureQueryData(trpc.wfp.firmKPIs.queryOptions());
		void queryClient.ensureQueryData(trpc.wfp.entityOverview.queryOptions());
		// Pod budgets tab data
		void queryClient.ensureQueryData(trpc.carbonites.getAll.queryOptions({}));
		void queryClient.ensureQueryData(trpc.podBudgets.getAll.queryOptions());
	},
});
