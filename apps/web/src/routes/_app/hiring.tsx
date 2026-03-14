import { createFileRoute } from "@tanstack/react-router";

type HiringSearch = {
	tab?: "open" | "active" | "offer" | "closed";
};

export const Route = createFileRoute("/_app/hiring")({
	validateSearch: (search: Record<string, unknown>): HiringSearch => ({
		tab:
			search.tab === "open" ||
			search.tab === "active" ||
			search.tab === "offer" ||
			search.tab === "closed"
				? search.tab
				: undefined,
	}),
	loaderDeps: ({ search }) => ({ tab: search.tab }),
	loader: ({ context: { trpc, queryClient }, deps: { tab } }) => {
		const status = tab ?? "open";
		void queryClient.ensureQueryData(
			trpc.hiring.getAll.queryOptions({ status }),
		);
		void queryClient.ensureQueryData(
			trpc.hiring.getAll.queryOptions({ status: "all" }),
		);
	},
});
