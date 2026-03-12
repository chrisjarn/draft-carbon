import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	EntitiesTable,
	EntityDialog,
	UsersTable,
	useUserStats,
} from "@/components/features/admin";
import { PageHeader } from "@/components/organisms/page-header";
import { PageStatsBar } from "@/components/organisms/page-stats-bar";
import { Page, PageBody, PageToolbar } from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/admin")({
	component: AdminPage,
});

type AdminTab = "users" | "entities";

function AdminPage() {
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user.id;
	const [tab, setTab] = useState<AdminTab>("users");
	const [entityDialogOpen, setEntityDialogOpen] = useState(false);

	// Stats for PageStatsBar
	const { stats: userStats, isPending: userStatsPending } = useUserStats();

	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());
	const entityCount = entitiesQuery.data?.length ?? 0;

	return (
		<Page>
			<PageHeader>
				{tab === "entities" && (
					<Button onClick={() => setEntityDialogOpen(true)}>
						<HugeiconsIcon
							icon={PlusSignIcon}
							className="mr-1.5 size-3.5"
							aria-hidden="true"
						/>
						Add Entity
					</Button>
				)}
			</PageHeader>

			<PageToolbar>
				<Tabs className="ml-auto" value={tab} onValueChange={(v) => setTab(v as AdminTab)}>
					<TabsList variant="underline">
						<TabsTrigger value="users">Users</TabsTrigger>
						<TabsTrigger value="entities">Entities</TabsTrigger>
					</TabsList>
				</Tabs>
			</PageToolbar>

			{tab === "users" ? (
				<PageStatsBar
					stats={[
						{
							label: "Total Users",
							value: userStats.total,
							loading: userStatsPending,
						},
						{
							label: "Admins",
							value: userStats.admins,
							loading: userStatsPending,
						},
						{
							label: "Pending Verification",
							value: userStats.pending,
							loading: userStatsPending,
						},
					]}
				/>
			) : (
				<PageStatsBar
					stats={[
						{
							label: "Total Entities",
							value: entityCount,
							loading: entitiesQuery.isPending,
						},
						{ label: "", value: "" },
						{ label: "", value: "" },
					]}
				/>
			)}

			<PageBody padded>
				{tab === "users" && <UsersTable currentUserId={currentUserId} />}
				{tab === "entities" && <EntitiesTable />}
			</PageBody>

			<EntityDialog
				key={String(entityDialogOpen)}
				mode="create"
				open={entityDialogOpen}
				onOpenChange={(o) => !o && setEntityDialogOpen(false)}
			/>
		</Page>
	);
}
