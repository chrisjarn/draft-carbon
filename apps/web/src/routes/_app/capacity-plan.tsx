import { createFileRoute } from "@tanstack/react-router";

type CapacityPlanSearch = {
	entity?: string;
};

export const Route = createFileRoute("/_app/capacity-plan")({
	validateSearch: (search: Record<string, unknown>): CapacityPlanSearch => ({
		entity: typeof search.entity === "string" ? search.entity : undefined,
	}),
});
