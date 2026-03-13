import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { stateName } from "@/components/features/carbonites/types";
import { DataTableColumnHeader } from "@/components/organisms/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { SERVICE_LINES, SL_COLOR_MAP, STATE_COLOR_MAP } from "@/lib/constants";
import { fmtK } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HiringNeed = {
	id: string;
	role: string;
	sl: string | null;
	sg: string | null;
	state: string | null;
	office: string | null;
	location: string | null;
	positions: number | null;
	type: string | null;
	priority: string | null;
	status: string | null;
	salaryMin: number | null;
	salaryMax: number | null;
	targetStart: string | null;
	approvedBy: string | null;
	managedBy: string | null;
	notes: string | null;
	closedHow: string | null;
	closedDate: string | null;
	closedName: string | null;
	createdAt: string | null;
	updatedAt: string | null;
};

export type TabStatus = "open" | "active" | "offer" | "closed";

// ── Service Line badge ────────────────────────────────────────────────────────

export function SlBadge({ sl }: { sl: string | null }) {
	if (!sl)
		return <span className="text-text-soft-400 text-sm tabular-nums">—</span>;
	const meta = SERVICE_LINES.find((s) => s.id === sl);
	const color = SL_COLOR_MAP[sl] ?? "#888";
	return (
		<span className="inline-flex items-center gap-1.5">
			<span
				className="size-2 shrink-0 rounded-full"
				style={{ backgroundColor: color }}
				aria-hidden="true"
			/>
			<span className="text-sm font-medium">{meta?.short ?? sl}</span>
		</span>
	);
}

// ── State badge ───────────────────────────────────────────────────────────────

export function HiringStateBadge({ state }: { state: string | null }) {
	if (!state)
		return <span className="text-text-soft-400 text-sm tabular-nums">—</span>;
	const color = STATE_COLOR_MAP[state];
	return (
		<Badge
			variant="outline"
			size="sm"
			className="font-medium uppercase"
			style={color ? { borderColor: color, color } : undefined}
		>
			{state.toUpperCase()}
		</Badge>
	);
}

// ── Priority badge ────────────────────────────────────────────────────────────

export const PRIORITY_STYLES: Record<string, string> = {
	critical: "border-red-200 bg-red-50 text-red-700",
	urgent: "border-red-200 bg-red-50 text-red-700",
	high: "border-orange-200 bg-orange-50 text-orange-700",
	medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
	low: "border-stroke-soft-200 bg-bg-weak-50 text-text-soft-400",
	planned: "border-stroke-soft-200 bg-bg-weak-50 text-text-soft-400",
};

export function PriorityBadge({ priority }: { priority: string | null }) {
	const key = (priority ?? "low").toLowerCase();
	const cls = PRIORITY_STYLES[key] ?? PRIORITY_STYLES.low;
	return (
		<Badge variant="outline" size="sm" className={cn("capitalize", cls)}>
			{priority ?? "—"}
		</Badge>
	);
}

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
	FT: "Full Time",
	PT: "Part Time",
	Contract: "Contract",
};

const TYPE_STYLES: Record<string, string> = {
	FT: "border-stroke-soft-200 bg-bg-weak-50 text-text-soft-400",
	PT: "border-violet-200 bg-violet-50 text-violet-700",
	Contract: "border-amber-200 bg-amber-50 text-amber-700",
};

export function TypeBadge({ type }: { type: string | null }) {
	if (!type) return null;
	const cls = TYPE_STYLES[type] ?? TYPE_STYLES.FT;
	return (
		<Badge variant="outline" size="sm" className={cls}>
			{TYPE_LABELS[type] ?? type}
		</Badge>
	);
}

// ── Status badge ──────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<string, string> = {
	open: "border-sky-200 bg-sky-50 text-sky-700",
	active: "border-blue-200 bg-blue-50 text-blue-700",
	offer: "border-violet-200 bg-violet-50 text-violet-700",
	closed: "border-stroke-soft-200 bg-bg-weak-50 text-text-soft-400",
};

export function HiringStatusBadge({ status }: { status: string | null }) {
	const key = (status ?? "open").toLowerCase();
	const cls = STATUS_STYLES[key] ?? STATUS_STYLES.open;
	return (
		<Badge variant="outline" size="sm" className={cn("capitalize", cls)}>
			{status ?? "open"}
		</Badge>
	);
}

// ── Closed How badge ──────────────────────────────────────────────────────────

const CLOSED_HOW_STYLES: Record<string, string> = {
	hired: "bg-success-light text-success-dark border-0",
	cancelled: "bg-error-light text-error-dark border-0",
	deferred: "bg-warning-light text-warning-dark border-0",
};

const CLOSED_HOW_LABELS: Record<string, string> = {
	hired: "Hired",
	cancelled: "Cancelled",
	deferred: "Deferred",
};

function ClosedHowBadge({ closedHow }: { closedHow: string | null }) {
	if (!closedHow) return <span className="text-text-soft-400 text-sm">—</span>;
	const key = closedHow.toLowerCase();
	const cls = CLOSED_HOW_STYLES[key];
	const label = CLOSED_HOW_LABELS[key] ?? closedHow;
	if (!cls) {
		return (
			<Badge variant="outline" size="sm" className="capitalize">
				{label}
			</Badge>
		);
	}
	return (
		<Badge size="sm" className={cn("capitalize", cls)}>
			{label}
		</Badge>
	);
}

// ── Salary helpers ─────────────────────────────────────────────────────────────

export function salaryRange(min: number | null, max: number | null) {
	if (!min && !max) return null;
	const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
	if (min && max) return `${fmt(min)} – ${fmt(max)}`;
	if (min) return `from ${fmt(min)}`;
	return max ? `up to ${fmt(max)}` : null;
}

// ── Target start formatter ────────────────────────────────────────────────────

function formatTargetStart(dateStr: string | null): string | null {
	if (!dateStr) return null;
	try {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
	} catch {
		return dateStr;
	}
}

// ── Days open helpers ─────────────────────────────────────────────────────────

export function daysOpen(
	createdAt: string | null,
	closedDate?: string | null,
): number {
	if (!createdAt) return 0;
	const start = new Date(createdAt).getTime();
	const end = closedDate ? new Date(closedDate).getTime() : Date.now();
	return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

/** Average TTH is ~6 weeks = 42 days (from TTH_SUMMARY) */
export const EXPECTED_DAYS = 42;

export function daysOpenColor(days: number): string {
	if (days > EXPECTED_DAYS) return "text-red-600";
	if (days > EXPECTED_DAYS * 0.75) return "text-amber-600";
	return "text-text-soft-400";
}

// ── Stats hook ────────────────────────────────────────────────────────────────

export function useHiringStats(rows: HiringNeed[], tab: TabStatus) {
	return useMemo(() => {
		if (tab === "closed") {
			const count = rows.length;
			const avgClose =
				count > 0
					? Math.round(
							rows.reduce(
								(sum, r) => sum + daysOpen(r.createdAt, r.closedDate),
								0,
							) / count,
						)
					: 0;
			const hiredCount = rows.filter((r) => r.closedHow === "hired").length;
			const hiredRate = count > 0 ? Math.round((hiredCount / count) * 100) : 0;
			return {
				stat1: { label: "Closed This FY", value: count },
				stat2: { label: "Avg Time to Close", value: `${avgClose}d` },
				stat3: { label: "Hired Rate", value: `${hiredRate}%`, raw: avgClose },
			};
		}
		const totalPositions = rows.reduce((sum, r) => sum + (r.positions ?? 1), 0);
		const totalSalary = rows.reduce((sum, r) => sum + (r.salaryMax ?? 0), 0);
		const fmtSalary =
			totalSalary >= 1_000_000
				? `$${(totalSalary / 1_000_000).toFixed(1)}m`
				: totalSalary >= 1_000
					? `$${Math.round(totalSalary / 1_000)}k`
					: `$${totalSalary}`;
		const avgDays =
			rows.length > 0
				? Math.round(
						rows.reduce((sum, r) => sum + daysOpen(r.createdAt), 0) /
							rows.length,
					)
				: 0;
		return {
			stat1: { label: "Open Positions", value: totalPositions },
			stat2: { label: "Salary Budget", value: fmtSalary },
			stat3: { label: "Avg Days Open", value: `${avgDays}d`, raw: avgDays },
		};
	}, [rows, tab]);
}

// ── Column definitions ────────────────────────────────────────────────────────

export function useHiringColumns(
	tab: TabStatus,
	revenueGapByStateSl: Map<string, number> = new Map(),
) {
	return useMemo<ColumnDef<HiringNeed, unknown>[]>(() => {
		const base: ColumnDef<HiringNeed, unknown>[] = [
			{
				accessorKey: "role",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Role" />
				),
				cell: ({ row }) => {
					const positions = row.original.positions ?? 1;
					const type = row.original.type;
					return (
						<div className="flex flex-col gap-0.5">
							<span className="font-medium text-sm">
								{row.getValue("role")}
								{positions > 1 && (
									<Badge
										variant="secondary"
										size="sm"
										className="ml-1.5 tabular-nums"
									>
										&times;{positions}
									</Badge>
								)}
							</span>
							{type && (
								<TypeBadge type={type} />
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "sl",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Service Line" />
				),
				cell: ({ row }) => (
					<SlBadge sl={row.getValue("sl") as string | null} />
				),
			},
			{
				accessorKey: "state",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="State" />
				),
				cell: ({ row }) => (
					<HiringStateBadge state={row.getValue("state") as string | null} />
				),
			},
			{
				accessorKey: "priority",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Priority" />
				),
				cell: ({ row }) => (
					<PriorityBadge priority={row.getValue("priority")} />
				),
			},
			{
				accessorKey: "targetStart",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Target Start" />
				),
				cell: ({ row }) => {
					const formatted = formatTargetStart(
						row.getValue("targetStart") as string | null,
					);
					return (
						<span className="text-sm tabular-nums">
							{formatted ?? (
								<span className="text-text-soft-400">—</span>
							)}
						</span>
					);
				},
			},
			{
				id: "salary",
				enableSorting: false,
				header: "Salary",
				cell: ({ row }) => {
					const range = salaryRange(
						row.original.salaryMin,
						row.original.salaryMax,
					);
					return range ? (
						<span className="text-sm tabular-nums">{range}</span>
					) : (
						<span className="text-text-soft-400 text-sm">—</span>
					);
				},
			},
			{
				id: "gapSolved",
				enableSorting: false,
				header: "Gap Solved",
				cell: ({ row }) => {
					const state = row.original.state ?? "";
					const sl = row.original.sl ?? "";
					const key = `${state}|${sl}`;
					const fallbackKey = `${state}|`;
					const gap =
						revenueGapByStateSl.get(key) ??
						revenueGapByStateSl.get(fallbackKey);
					if (!gap || gap <= 0) return null;
					return (
						<span className="text-text-soft-400 text-xs tabular-nums">
							~${fmtK(gap)} {stateName(state)} shortfall
						</span>
					);
				},
			},
		];

		if (tab === "closed") {
			base.push({
				accessorKey: "closedHow",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Outcome" />
				),
				cell: ({ row }) => (
					<ClosedHowBadge
						closedHow={row.getValue("closedHow") as string | null}
					/>
				),
			});
		} else {
			base.push({
				id: "daysOpen",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Days Open" />
				),
				accessorFn: (row) => daysOpen(row.createdAt),
				cell: ({ row }) => {
					const days = daysOpen(row.original.createdAt);
					const isOverdue = days > EXPECTED_DAYS;
					return isOverdue ? (
						<Badge
							variant="outline"
							size="sm"
							className="border-red-200 bg-red-50 tabular-nums text-red-700"
						>
							{days}d
						</Badge>
					) : (
						<span
							className={cn(
								"text-sm tabular-nums",
								daysOpenColor(days),
							)}
						>
							{days}d
						</span>
					);
				},
			});
		}

		return base;
	}, [tab, revenueGapByStateSl]);
}
