import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	PencilEdit01Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useState } from "react";
import { DataTableColumnHeader } from "@/components/organisms/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { attainmentPct, fmt, type RevenueRow, variance } from "./types";

// -- Progress bar -------------------------------------------------------------

function RevenueBar({
	target,
	actual,
}: {
	target: string | null;
	actual: string | null;
}) {
	const t = Number(target);
	const a = Number(actual);
	if (!t) return <div className="h-1.5 w-full rounded-full bg-bg-weak-50" />;
	const pct = Math.min((a / t) * 100, 100);
	const over = a > t;
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-weak-50">
			<div
				className={`h-full rounded-full transition-[width] ${over ? "bg-green-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500"}`}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

// -- Inline editable dollar cell ----------------------------------------------

export function RevenueCell({
	value,
	onSave,
	disabled,
}: {
	value: string | null | undefined;
	onSave: (v: string) => void;
	disabled?: boolean;
}) {
	const [editing, setEditing] = useState(false);
	const [val, setVal] = useState(value ?? "");

	if (disabled)
		return <span className="text-sm tabular-nums">{fmt(value)}</span>;

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<span className="text-text-soft-400 text-sm">$</span>
				<Input
					type="number"
					value={val}
					onChange={(e) => setVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onSave(val);
							setEditing(false);
						}
						if (e.key === "Escape") setEditing(false);
					}}
					className="h-6 w-24 text-sm"
				/>
				<button
					type="button"
					aria-label="Save value"
					onClick={() => {
						onSave(val);
						setEditing(false);
					}}
					className="rounded-sm text-green-400 hover:text-green-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950"
				>
					<HugeiconsIcon
						icon={Tick01Icon}
						className="size-3.5"
						aria-hidden="true"
					/>
				</button>
			</div>
		);
	}

	return (
		<div className="group flex items-center gap-1">
			<span className="text-sm tabular-nums">{fmt(value)}</span>
			<button
				type="button"
				aria-label="Edit value"
				onClick={() => {
					setVal(value ?? "");
					setEditing(true);
				}}
				className="rounded-sm text-text-soft-400 opacity-0 transition-opacity hover:text-text-strong-950 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950 group-hover:opacity-100"
			>
				<HugeiconsIcon
					icon={PencilEdit01Icon}
					className="size-3"
					aria-hidden="true"
				/>
			</button>
		</div>
	);
}

// -- Column widths ------------------------------------------------------------

const COL_WIDTHS = {
	biz: 200,
	target: 130,
	actual: 130,
	variance: 110,
	progress: 160,
	attainment: 80,
} as const;

// -- Column definitions -------------------------------------------------------

export function makeRevenueColumns(
	canWriteAccess: boolean,
	onSave: (entId: string, field: "target" | "actual", value: string) => void,
): ColumnDef<RevenueRow>[] {
	return [
		{
			accessorKey: "stateGroup",
			header: "State",
			enableHiding: false,
		},
		{
			accessorKey: "biz",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Entity" />
			),
			cell: ({ row }) => <span className="text-sm">{row.original.biz}</span>,
			size: COL_WIDTHS.biz,
			minSize: 140,
		},
		{
			id: "target",
			accessorFn: (row) => Number(row.revenue?.target ?? 0),
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Target" />
			),
			cell: ({ row }) => (
				<RevenueCell
					value={row.original.revenue?.target ?? null}
					onSave={(v) => onSave(row.original.id, "target", v)}
					disabled={!canWriteAccess}
				/>
			),
			aggregationFn: "sum",
			size: COL_WIDTHS.target,
		},
		{
			id: "actual",
			accessorFn: (row) => Number(row.revenue?.actual ?? 0),
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Actual" />
			),
			cell: ({ row }) => (
				<RevenueCell
					value={row.original.revenue?.actual ?? null}
					onSave={(v) => onSave(row.original.id, "actual", v)}
					disabled={!canWriteAccess}
				/>
			),
			aggregationFn: "sum",
			size: COL_WIDTHS.actual,
		},
		{
			id: "variance",
			header: "Variance",
			cell: ({ row }) => {
				const target = row.original.revenue?.target ?? null;
				const actual = row.original.revenue?.actual ?? null;
				const v = variance(target, actual);
				return (
					<span
						className={`font-medium text-sm tabular-nums ${v.positive === null ? "text-text-soft-400" : v.positive ? "text-green-400" : "text-red-400"}`}
					>
						{v.val}
					</span>
				);
			},
			size: COL_WIDTHS.variance,
		},
		{
			id: "progress",
			header: "Progress",
			cell: ({ row }) => (
				<RevenueBar
					target={row.original.revenue?.target ?? null}
					actual={row.original.revenue?.actual ?? null}
				/>
			),
			size: COL_WIDTHS.progress,
		},
		{
			id: "attainment",
			header: "Attainment",
			cell: ({ row }) => {
				const pct = attainmentPct(
					row.original.revenue?.target ?? null,
					row.original.revenue?.actual ?? null,
				);
				return (
					<span
						className={`font-medium text-sm tabular-nums ${pct === null ? "text-text-soft-400" : pct >= 100 ? "text-green-400" : pct >= 80 ? "text-amber-400" : "text-red-400"}`}
					>
						{pct !== null ? `${pct}%` : "\u2014"}
					</span>
				);
			},
			size: COL_WIDTHS.attainment,
		},
	];
}

// -- Group row cells ----------------------------------------------------------

export function buildGroupCells(
	row: Row<RevenueRow>,
): Record<string, ReactNode> {
	const isExpanded = row.getIsExpanded();
	const leafRows = row.getLeafRows();
	const totalTarget = leafRows.reduce(
		(s, r) => s + Number(r.original.revenue?.target ?? 0),
		0,
	);
	const totalActual = leafRows.reduce(
		(s, r) => s + Number(r.original.revenue?.actual ?? 0),
		0,
	);
	const v = variance(String(totalTarget), String(totalActual));
	const pct = attainmentPct(String(totalTarget), String(totalActual));

	return {
		biz: (
			<button
				type="button"
				onClick={() => row.toggleExpanded()}
				className="flex items-center gap-2 text-left"
			>
				{isExpanded ? (
					<HugeiconsIcon
						icon={ArrowDown01Icon}
						className="size-4 text-text-soft-400"
						aria-hidden="true"
					/>
				) : (
					<HugeiconsIcon
						icon={ArrowRight01Icon}
						className="size-4 text-text-soft-400"
						aria-hidden="true"
					/>
				)}
				<span className="font-bold">{row.getValue("stateGroup")}</span>
				<Badge variant="outline" size="sm">
					{leafRows.length} entities
				</Badge>
			</button>
		),
		target: (
			<span className="font-medium text-sm tabular-nums">
				{fmt(String(totalTarget))}
			</span>
		),
		actual: (
			<span className="font-medium text-sm tabular-nums">
				{fmt(String(totalActual))}
			</span>
		),
		variance: (
			<span
				className={`font-medium text-sm tabular-nums ${v.positive === null ? "text-text-soft-400" : v.positive ? "text-green-400" : "text-red-400"}`}
			>
				{v.val}
			</span>
		),
		progress: (
			<RevenueBar target={String(totalTarget)} actual={String(totalActual)} />
		),
		attainment: (
			<span
				className={`font-medium text-sm tabular-nums ${pct === null ? "text-text-soft-400" : pct >= 100 ? "text-green-400" : pct >= 80 ? "text-amber-400" : "text-red-400"}`}
			>
				{pct !== null ? `${pct}%` : "\u2014"}
			</span>
		),
	};
}

// -- Footer totals ------------------------------------------------------------

export function TotalsFooter({
	totalTarget,
	totalActual,
	fy,
}: {
	totalTarget: number;
	totalActual: number;
	fy: string;
}) {
	const v = variance(String(totalTarget), String(totalActual));
	const pct = attainmentPct(String(totalTarget), String(totalActual));

	return (
		<TableFooter>
			<TableRow className="bg-bg-weak-50/30 font-semibold">
				{/* stateGroup (hidden) + biz */}
				<TableCell className="text-text-soft-400">Total ({fy})</TableCell>
				<TableCell className="text-sm tabular-nums">
					{fmt(String(totalTarget))}
				</TableCell>
				<TableCell className="text-sm tabular-nums">
					{fmt(String(totalActual))}
				</TableCell>
				<TableCell>
					<span
						className={`text-sm tabular-nums ${v.positive === null ? "text-text-soft-400" : v.positive ? "text-green-400" : "text-red-400"}`}
					>
						{v.val}
					</span>
				</TableCell>
				<TableCell>
					<RevenueBar
						target={String(totalTarget)}
						actual={String(totalActual)}
					/>
				</TableCell>
				<TableCell>
					<span
						className={`text-sm tabular-nums ${
							pct === null
								? "text-text-soft-400"
								: pct >= 100
									? "text-green-400"
									: pct >= 80
										? "text-amber-400"
										: "text-red-400"
						}`}
					>
						{pct !== null ? `${pct}%` : "\u2014"}
					</span>
				</TableCell>
			</TableRow>
		</TableFooter>
	);
}
