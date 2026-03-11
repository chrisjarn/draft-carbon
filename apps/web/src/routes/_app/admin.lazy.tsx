import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	EntitiesTable,
	EntityDialog,
	UsersTable,
} from "@/components/features/admin";
import { PageHeader } from "@/components/organisms/page-header";
import { Page, PageToolbar } from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export const Route = createLazyFileRoute("/_app/admin")({
	component: AdminPage,
});

type AdminTab = "users" | "entities";

function AdminPage() {
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user.id;
	const [tab, setTab] = useState<AdminTab>("users");
	const [entityDialogOpen, setEntityDialogOpen] = useState(false);

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
				<Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)}>
					<TabsList variant="underline">
						<TabsTrigger value="users">Users</TabsTrigger>
						<TabsTrigger value="entities">Entities</TabsTrigger>
					</TabsList>
				</Tabs>
			</PageToolbar>

			{tab === "users" && <UsersTable currentUserId={currentUserId} />}
			{tab === "entities" && <EntitiesTable />}

			<EntityDialog
				key={String(entityDialogOpen)}
				mode="create"
				open={entityDialogOpen}
				onOpenChange={(o) => !o && setEntityDialogOpen(false)}
			/>
		</Page>
	);
}
