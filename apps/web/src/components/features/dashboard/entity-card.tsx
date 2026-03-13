import { Building06Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import { StaffAvatars } from "@/components/molecules/staff-avatars";
import { Badge } from "@/components/ui/badge";
import { Card, CardStatBar } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_LINES, STATE_COLOR_MAP } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────────────────────

export type EntitySummary = {
	id: string;
	biz: string;
	state: string | null;
	officeId: string | null;
	legalName: string | null;
	phone: string | null;
	address: string | null;
	email: string | null;
	headcount: number;
	totalSalary: number;
	totalBudget: number;
	sls: string[];
	staffInitials: string[];
	staffNames: string[];
	podCount: number;
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StateBadge({ stateId }: { stateId: string | null }) {
	if (!stateId) return null;
	const color = STATE_COLOR_MAP[stateId];
	return (
		<Badge
			variant="outline"
			className="h-5 shrink-0 text-xs uppercase tracking-wide"
			style={color ? { borderColor: color, color } : undefined}
		>
			{stateId}
		</Badge>
	);
}

function SlTags({ sls }: { sls: string[] }) {
	if (sls.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-1">
			{sls.map((sl) => {
				const meta = SERVICE_LINES.find((s) => s.id === sl);
				return (
					<span
						key={sl}
						className="rounded-md border border-stroke-soft-200 bg-bg-weak-50/50 px-1.5 py-px font-medium text-text-soft-400 text-xs"
					>
						{meta?.short ?? sl}
					</span>
				);
			})}
		</div>
	);
}

function BudgetBar({
	totalSalary,
	totalBudget,
}: {
	totalSalary: number;
	totalBudget: number;
}) {
	if (totalBudget <= 0) return null;
	const pct = Math.min((totalSalary / totalBudget) * 100, 100);
	const over = totalSalary > totalBudget;
	const remaining = totalBudget - totalSalary;
	const barColor = over
		? "bg-red-500"
		: pct >= 90
			? "bg-amber-500"
			: "bg-emerald-500";

	return (
		<div className="px-5 pb-3">
			<div className="mb-1 flex items-center justify-between">
				<span className="text-text-soft-400 text-xs">Budget</span>
				<span
					className={`text-xs tabular-nums ${over ? "text-red-400" : "text-text-soft-400"}`}
				>
					{over
						? `${fmtDollar(Math.abs(remaining))} over`
						: `${fmtDollar(remaining)} remaining`}
				</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-weak-50">
				<div
					className={`h-full rounded-full transition-all ${barColor}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

// ── Entity Card ──────────────────────────────────────────────────────────────

export function EntityCard({
	entity,
	fy,
	attainmentPct,
}: {
	entity: EntitySummary;
	fy: string;
	attainmentPct?: number | null;
}) {
	const navigate = useNavigate();

	return (
		<div
			role="link"
			tabIndex={0}
			onClick={() =>
				navigate({
					to: "/capacity-plan",
					search: { entity: entity.id, fy },
				})
			}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					navigate({
						to: "/capacity-plan",
						search: { entity: entity.id, fy },
					});
				}
			}}
			className="group h-full min-h-55 cursor-pointer shadow-custom-input rounded-20 hover:bg-bg-weak-50 transition-all duration-200"
		>
			<Card flushFooter className="h-full gap-0">
				{/* Header */}
				<div className="flex items-start justify-between gap-2 px-5 pt-5 pb-1">
					<div className="min-w-0">
						<h3 className="truncate font-semibold text-lg leading-tight tracking-tight">
							{entity.biz}
						</h3>
						{entity.legalName && (
							<p className="mt-0.5 truncate text-text-soft-400 text-sm">
								{entity.legalName}
							</p>
						)}
					</div>
					<div className="flex shrink-0 items-center gap-1.5">
						{attainmentPct != null && (
							<Badge
								variant={
									attainmentPct >= 95
										? "success"
										: attainmentPct >= 80
											? "warning"
											: "error"
								}
								size="sm"
								className="tabular-nums"
							>
								{attainmentPct}%
							</Badge>
						)}
						<StateBadge stateId={entity.state} />
					</div>
				</div>

				{/* Staff + SL tags */}
				<div className="mt-auto space-y-2.5 px-5 pt-3 pb-3">
					<StaffAvatars
						initials={entity.staffInitials}
						names={entity.staffNames}
						headcount={entity.headcount}
					/>
					<SlTags sls={entity.sls} />
				</div>

				{/* Budget bar */}
				<BudgetBar
					totalSalary={entity.totalSalary}
					totalBudget={entity.totalBudget}
				/>

				{/* Footer stats */}
				<CardStatBar
					stats={[
						{
							label: "Payroll/yr",
							value: fmtDollar(entity.totalSalary),
							align: "left",
						},
						{ label: "Staff", value: entity.headcount },
						{ label: "Pods", value: entity.podCount },
					]}
				/>
			</Card>
		</div>
	);
}

// ── Grid with loading skeleton ───────────────────────────────────────────────

export function EntityCardGrid({
	data,
	loading,
	fy,
	columns = 3,
	revenueMap,
}: {
	data: EntitySummary[] | undefined;
	loading: boolean;
	fy: string;
	columns?: 2 | 3;
	revenueMap?: Map<string, number>;
}) {
	const gridClass =
		columns === 2
			? "grid grid-cols-1 gap-5 sm:grid-cols-2"
			: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

	if (loading) {
		return (
			<div className={gridClass}>
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={`skel-${i.toString()}`} size="sm" className="">
						<div className="space-y-3 p-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-5 w-8 rounded-full" />
							</div>
							<Skeleton className="h-3 w-48" />
							<div className="space-y-1.5">
								<Skeleton className="h-3 w-40" />
								<Skeleton className="h-3 w-28" />
							</div>
							<div className="flex gap-1">
								{Array.from({ length: 4 }).map((_, j) => (
									<Skeleton
										key={`av-${j.toString()}`}
										className="size-7 rounded-full"
									/>
								))}
							</div>
							<div className="flex justify-between border-t pt-2.5">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
					</Card>
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Empty className="py-8 md:py-8">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon icon={Building06Icon} />
					</EmptyMedia>
					<EmptyTitle>No entities found</EmptyTitle>
					<EmptyDescription>Add entities to see them here.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className={gridClass}>
			{data.map((entity) => (
				<EntityCard
					key={entity.id}
					entity={entity}
					fy={fy}
					attainmentPct={revenueMap?.get(entity.id)}
				/>
			))}
		</div>
	);
}
