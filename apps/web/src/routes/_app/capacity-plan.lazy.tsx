import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { FirmTab } from "@/components/capacity-plan/firm-tab";
import { PodBudgetsTab } from "@/components/capacity-plan/pod-budgets-tab";
import { StaffTab } from "@/components/capacity-plan/staff-tab";
import { PageHeader } from "@/components/shared/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FY_OPTIONS } from "@/lib/constants";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/capacity-plan")({
	component: CapacityPlanPage,
});

type TabValue = "firm" | "staff" | "pod-budgets";

function CapacityPlanPage() {
	const { entity, fy } = Route.useSearch();
	const navigate = useNavigate({ from: "/capacity-plan" });
	const [tab, setTab] = useState<TabValue>("firm");

	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());
	const entitiesList = entitiesQuery.data ?? [];

	const setEntity = (id: string | undefined) => {
		void navigate({
			search: (prev: Record<string, unknown>) => ({ ...prev, entity: id }),
		});
	};

	const setFy = (value: string | undefined) => {
		void navigate({
			search: (prev: Record<string, unknown>) => ({ ...prev, fy: value }),
		});
	};

	const entityLabel = entity
		? (entitiesList.find((e) => e.id === entity)?.biz ?? entity)
		: "All Entities";

	return (
		<div className="flex h-full flex-col">
			<PageHeader />

			{/* Toolbar — selectors + tabs */}
			<div className="flex items-center gap-2 border-border border-b bg-white px-6 py-2">
				<Select
					value={entity ?? "__all__"}
					onValueChange={(v) =>
						setEntity(v === "__all__" ? undefined : v || undefined)
					}
				>
					<SelectTrigger className="w-44 text-sm">
						<span className="flex flex-1 truncate text-left">
							{entityLabel}
						</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">All Entities</SelectItem>
						{entitiesList.map((e) => (
							<SelectItem key={e.id} value={e.id}>
								{e.biz}
								{e.state ? ` (${e.state.toUpperCase()})` : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={fy ?? "__default__"}
					onValueChange={(v) =>
						setFy(v === "__default__" ? undefined : v || undefined)
					}
				>
					<SelectTrigger className="w-28 text-sm">
						<span className="flex flex-1 truncate text-left">
							{fy ?? "All FYs"}
						</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__default__">All FYs</SelectItem>
						{FY_OPTIONS.map((f) => (
							<SelectItem key={f} value={f}>
								{f}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
					<TabsList>
						<TabsTrigger value="firm">Firm</TabsTrigger>
						<TabsTrigger value="staff">Staff</TabsTrigger>
						<TabsTrigger value="pod-budgets">Pod Budgets</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-auto">
				{tab === "firm" && <FirmTab initialEntityId={entity} />}
				{tab === "staff" && <StaffTab entityId={entity} />}
				{tab === "pod-budgets" && <PodBudgetsTab />}
			</div>
		</div>
	);
}
