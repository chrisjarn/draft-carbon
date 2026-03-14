import { Building06Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import { StaffAvatars } from "@/components/molecules/staff-avatars";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_LINES, STATE_COLOR_MAP } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { cn } from "@/lib/utils";

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
		<span
			className="rounded-md border px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wide"
			style={{
				borderColor: color ? `${color}40` : "var(--color-stroke-soft-200)",
				color: color ?? "var(--color-text-soft-400)",
			}}
		>
			{stateId}
		</span>
	);
}

function AttainmentBadge({ pct }: { pct: number }) {
	const colors =
		pct >= 95
			? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
			: pct >= 80
				? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
				: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400";

	return (
		<span
			className={cn(
				"rounded-md px-1.5 py-0.5 font-semibold text-xs tabular-nums",
				colors,
			)}
		>
			{pct}%
		</span>
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
						className="rounded-md border border-stroke-soft-200/60 bg-bg-weak-50/40 px-1.5 py-0.5 font-medium text-[10px] text-text-soft-400 dark:border-neutral-700 dark:bg-neutral-800/50"
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
		<div className="px-4 pb-3">
			<div className="mb-1.5 flex items-center justify-between">
				<span className="text-[10px] text-text-soft-400 uppercase tracking-wider">
					Budget
				</span>
				<span
					className={cn(
						"text-[11px] tabular-nums",
						over ? "text-red-500" : "text-text-soft-400",
					)}
				>
					{over
						? `${fmtDollar(Math.abs(remaining))} over`
						: `${fmtDollar(remaining)} remaining`}
				</span>
			</div>
			<div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
				<div
					className={cn("h-full rounded-full transition-all", barColor)}
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
			className={cn(
				"group flex h-full min-h-52 cursor-pointer flex-col rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
			)}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3 p-4 pb-2">
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-base text-text-strong-950 leading-tight tracking-tight">
						{entity.biz}
					</h3>
					{entity.legalName && (
						<p className="mt-0.5 truncate text-sm text-text-soft-400">
							{entity.legalName}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{attainmentPct != null && <AttainmentBadge pct={attainmentPct} />}
					<StateBadge stateId={entity.state} />
				</div>
			</div>

			{/* Staff + SL tags */}
			<div className="flex flex-1 flex-col gap-2.5 px-4 pt-2 pb-3">
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
			<div className="flex items-center divide-x divide-stroke-soft-200/60 border-t border-stroke-soft-200/60 dark:divide-neutral-800 dark:border-neutral-800">
				<div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
					<span className="font-semibold text-sm tabular-nums tracking-tight text-text-strong-950">
						{fmtDollar(entity.totalSalary)}
					</span>
					<span className="text-[10px] text-text-soft-400">Payroll/yr</span>
				</div>
				<div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
					<span className="font-semibold text-sm tabular-nums tracking-tight text-text-strong-950">
						{entity.headcount}
					</span>
					<span className="text-[10px] text-text-soft-400">Staff</span>
				</div>
				<div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
					<span className="font-semibold text-sm tabular-nums tracking-tight text-text-strong-950">
						{entity.podCount}
					</span>
					<span className="text-[10px] text-text-soft-400">Pods</span>
				</div>
			</div>
		</div>
	);
}

// ── Skeleton Card ────────────────────────────────────────────────────────────

function EntityCardSkeleton() {
	return (
		<div
			className={cn(
				"flex h-full min-h-52 flex-col rounded-xl border border-stroke-soft-200/80 bg-bg-white-0",
				"dark:border-neutral-800 dark:bg-neutral-900/50",
			)}
		>
			{/* Header */}
			<div className="p-4 pb-2">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
					<div className="flex gap-1.5">
						<Skeleton className="h-5 w-10 rounded-md" />
						<Skeleton className="h-5 w-8 rounded-md" />
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col gap-2.5 px-4 pt-2 pb-3">
				<div className="flex gap-1">
					{Array.from({ length: 4 }).map((_, j) => (
						<Skeleton key={`av-${j}`} className="size-7 rounded-full" />
					))}
				</div>
				<div className="flex gap-1">
					<Skeleton className="h-5 w-12 rounded-md" />
					<Skeleton className="h-5 w-10 rounded-md" />
				</div>
			</div>

			{/* Budget */}
			<div className="px-4 pb-3">
				<div className="mb-1.5 flex items-center justify-between">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-3 w-24" />
				</div>
				<Skeleton className="h-1 w-full rounded-full" />
			</div>

			{/* Footer */}
			<div className="flex items-center divide-x divide-stroke-soft-200/60 border-t border-stroke-soft-200/60 dark:divide-neutral-800 dark:border-neutral-800">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex flex-1 flex-col items-center gap-1 py-2.5">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-3 w-12" />
					</div>
				))}
			</div>
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
			? "grid grid-cols-1 gap-4 sm:grid-cols-2"
			: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

	if (loading) {
		return (
			<div className={gridClass}>
				{Array.from({ length: 6 }).map((_, i) => (
					<EntityCardSkeleton key={`skel-${i}`} />
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stroke-soft-200 py-12 text-center dark:border-neutral-700">
				<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
					<HugeiconsIcon
						icon={Building06Icon}
						className="size-6 text-text-soft-400"
					/>
				</div>
				<h3 className="font-semibold text-sm text-text-strong-950">
					No entities found
				</h3>
				<p className="mt-1 text-sm text-text-soft-400">
					Add entities to see them here.
				</p>
			</div>
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
