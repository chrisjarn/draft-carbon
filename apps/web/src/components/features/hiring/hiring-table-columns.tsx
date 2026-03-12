import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { slLabel, stateName } from "@/components/features/carbonites/types";
import { DataTableColumnHeader } from "@/components/organisms/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

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

// ── Badge helpers ─────────────────────────────────────────────────────────────

export const PRIORITY_STYLES: Record<string, string> = {
	critical: "border-red-500/40 bg-red-500/10 text-red-400",
	urgent: "border-red-500/40 bg-red-500/10 text-red-400",
	high: "border-orange-500/40 bg-orange-500/10 text-orange-400",
	medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
	low: "border-border bg-muted/40 text-muted-foreground",
	planned: "border-border bg-muted/40 text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: string | null }) {
	const cls = PRIORITY_STYLES[priority ?? "low"] ?? PRIORITY_STYLES.low;
	return (
		<Badge variant="outline" size="sm" className={`capitalize ${cls}`}>
			{priority ?? "\u2014"}
		</Badge>
	);
}

export function TypeBadge({ type }: { type: string | null }) {
	return (
		<Badge variant="outline" size="sm">
			{type ?? "\u2014"}
		</Badge>
	);
}

export const STATUS_STYLES: Record<string, string> = {
	open: "border-sky-500/40 bg-sky-500/10 text-sky-400",
	active: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	offer: "border-violet-500/40 bg-violet-500/10 text-violet-400",
	closed: "border-border bg-muted/40 text-muted-foreground",
};

export function HiringStatusBadge({ status }: { status: string | null }) {
	const cls = STATUS_STYLES[status ?? "open"] ?? STATUS_STYLES.open;
	return (
		<Badge variant="outline" size="sm" className={`capitalize ${cls}`}>
			{status ?? "open"}
		</Badge>
	);
}

export function salaryRange(min: number | null, max: number | null) {
	if (!min && !max) return "\u2014";
	const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
	if (min && max) return `${fmt(min)} \u2013 ${fmt(max)}`;
	if (min) return `from ${fmt(min)}`;
	return max ? `up to ${fmt(max)}` : "\u2014";
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
	if (days > EXPECTED_DAYS) return "text-red-500";
	if (days > EXPECTED_DAYS * 0.75) return "text-amber-500";
	return "text-muted-foreground";
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

export function useHiringColumns(tab: TabStatus) {
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
					return (
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
					);
				},
			},
			{
				accessorKey: "sl",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Service Line" />
				),
				cell: ({ row }) => {
					const val = row.getValue("sl") as string | null | undefined;
					return (
						<span className="text-sm">{val ? slLabel(val) : "\u2014"}</span>
					);
				},
			},
			{
				accessorKey: "state",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="State" />
				),
				cell: ({ row }) => {
					const val = row.getValue("state") as string | null | undefined;
					return (
						<span className="text-sm">{val ? stateName(val) : "\u2014"}</span>
					);
				},
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
				cell: ({ row }) => (
					<span className="text-sm">
						{(row.getValue("targetStart") as string) ?? "\u2014"}
					</span>
				),
			},
			{
				id: "salary",
				enableSorting: false,
				header: "Salary",
				cell: ({ row }) => (
					<span className="text-sm">
						{salaryRange(row.original.salaryMin, row.original.salaryMax)}
					</span>
				),
			},
		];

		if (tab === "closed") {
			base.push({
				accessorKey: "closedHow",
				enableSorting: true,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Closed How" />
				),
				cell: ({ row }) => (
					<Badge variant="outline" size="sm" className="capitalize">
						{(row.getValue("closedHow") as string) ?? "\u2014"}
					</Badge>
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
					return (
						<span
							className={`text-right text-sm tabular-nums ${daysOpenColor(days)}`}
						>
							{days}d
						</span>
					);
				},
			});
		}

		return base;
	}, [tab]);
}
