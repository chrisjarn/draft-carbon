import { ChartLineData02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { FirmTab } from "@/components/capacity-plan/firm-tab";
import { PodBudgetsTab } from "@/components/capacity-plan/pod-budgets-tab";
import { StaffTab } from "@/components/capacity-plan/staff-tab";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createLazyFileRoute("/_app/capacity-plan")({
	component: CapacityPlanPage,
});

type TabValue = "firm" | "staff" | "pod-budgets";

function CapacityPlanPage() {
	const { entity } = Route.useSearch();
	const [tab, setTab] = useState<TabValue>(entity ? "firm" : "firm");

	return (
		<div className="flex h-full flex-col">
			<PageHeader>
				<Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
					<TabsList className="h-8">
						<TabsTrigger value="firm" className="px-3 text-xs">
							Firm
						</TabsTrigger>
						<TabsTrigger value="staff" className="px-3 text-xs">
							Staff
						</TabsTrigger>
						<TabsTrigger value="pod-budgets" className="px-3 text-xs">
							Pod Budgets
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<HugeiconsIcon
					icon={ChartLineData02Icon}
					className="size-4 text-muted-foreground"
				/>
			</PageHeader>

			{/* Tab content */}
			<div className="flex-1 overflow-auto">
				{tab === "firm" && <FirmTab initialEntityId={entity} />}
				{tab === "staff" && <StaffTab />}
				{tab === "pod-budgets" && <PodBudgetsTab />}
			</div>
		</div>
	);
}
