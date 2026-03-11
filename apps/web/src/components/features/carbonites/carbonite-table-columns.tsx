import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { PerfBadge } from "@/components/molecules/perf-badge";
import { RiskBadge } from "@/components/molecules/risk-badge";
import { avatarColor } from "@/components/molecules/staff-avatars";
import { DataTableColumnHeader } from "@/components/organisms/data-table/data-table-column-header";
import type { Option } from "@/components/organisms/data-table/types/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { initials } from "@/lib/format";

import type { Carbonite } from "./types";
import { officeLabel, slColor, slLabel, stateLabel } from "./types";

// ── Faceted filter function ───────────────────────────────────────────────────

const arrIncludesFilter: FilterFn<Carbonite> = (
	row,
	columnId,
	filterValue: string[],
) => {
	if (!filterValue || filterValue.length === 0) return true;
	const cellValue = row.getValue<string | null>(columnId);
	return cellValue != null && filterValue.includes(cellValue);
};

// ── Option builders ──────────────────────────────────────────────────────────

export function buildCarboniteSlOptions(data: Carbonite[]): Option[] {
	const counts = new Map<string, number>();
	for (const c of data) {
		if (c.sl) counts.set(c.sl, (counts.get(c.sl) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([value, count]) => ({ label: slLabel(value), value, count }));
}

export function buildCarboniteStateOptions(data: Carbonite[]): Option[] {
	const counts = new Map<string, number>();
	for (const c of data) {
		if (c.state) counts.set(c.state, (counts.get(c.state) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([value, count]) => ({ label: stateLabel(value), value, count }));
}

export function buildCarboniteOfficeOptions(data: Carbonite[]): Option[] {
	const counts = new Map<string, number>();
	for (const c of data) {
		if (c.office) counts.set(c.office, (counts.get(c.office) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([value, count]) => ({ label: officeLabel(value), value, count }));
}

export function buildCarboniteTypeOptions(data: Carbonite[]): Option[] {
	const counts = new Map<string, number>();
	for (const c of data) {
		const t = c.type ?? "FT";
		counts.set(t, (counts.get(t) ?? 0) + 1);
	}
	return ["FT", "PT"]
		.filter((v) => counts.has(v))
		.map((value) => ({
			label: value === "FT" ? "Full-time" : "Part-time",
			value,
			count: counts.get(value),
		}));
}

// ── Column definitions ────────────────────────────────────────────────────────

interface CarboniteColumnsOpts {
	onEdit: (carbonite: Carbonite) => void;
	canEdit: boolean;
	slOptions: Option[];
	stateOptions: Option[];
	officeOptions: Option[];
	typeOptions: Option[];
	perfMap?: Map<string, string | null>;
	riskMap?: Map<string, string | null>;
}

export function getCarboniteTableColumns(
	opts: CarboniteColumnsOpts,
): ColumnDef<Carbonite>[] {
	const columns: ColumnDef<Carbonite>[] = [];

	// Select column — only for writers
	if (opts.canEdit) {
		columns.push({
			id: "select",
			size: 40,
			enableSorting: false,
			enableHiding: false,
			enableColumnFilter: false,
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					indeterminate={table.getIsSomePageRowsSelected()}
					onCheckedChange={() => table.toggleAllPageRowsSelected()}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={() => row.toggleSelected()}
					onClick={(e) => e.stopPropagation()}
					aria-label={`Select ${row.original.name}`}
				/>
			),
		});
	}

	columns.push(
		// Name column with avatar
		{
			accessorKey: "name",
			enableSorting: true,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => {
				const name = row.getValue<string>("name");
				const ini = initials(name);
				const color = avatarColor(ini);
				return (
					<div className="flex items-center gap-2">
						<span
							className="flex size-6 shrink-0 items-center justify-center rounded-full font-semibold text-[10px] text-white"
							style={{ backgroundColor: color }}
						>
							{ini}
						</span>
						<span className="font-medium text-sm">{name}</span>
					</div>
				);
			},
			size: 200,
			meta: { label: "Name" },
		},

		// Role
		{
			accessorKey: "role",
			enableSorting: true,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Role" />
			),
			cell: ({ getValue }) => (
				<span className="text-muted-foreground text-sm">
					{(getValue() as string | null) ?? "\u2014"}
				</span>
			),
			meta: { label: "Role" },
		},

		// Service Line
		{
			accessorKey: "sl",
			enableSorting: true,
			filterFn: arrIncludesFilter,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="SL" />
			),
			cell: ({ getValue }) => {
				const sl = getValue() as string | null;
				if (!sl) {
					return (
						<span className="text-muted-foreground text-sm">{"\u2014"}</span>
					);
				}
				const color = slColor(sl);
				return (
					<Badge
						variant="outline"
						size="sm"
						style={{
							borderColor: `${color}40`,
							color: color,
							backgroundColor: `${color}10`,
						}}
					>
						{slLabel(sl)}
					</Badge>
				);
			},
			meta: {
				label: "Service Line",
				variant: "multiSelect" as const,
				options: opts.slOptions,
			},
		},

		// State
		{
			accessorKey: "state",
			enableSorting: true,
			filterFn: arrIncludesFilter,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="State" />
			),
			cell: ({ getValue }) => {
				const val = getValue() as string | null;
				return (
					<span className="text-sm">{val ? stateLabel(val) : "\u2014"}</span>
				);
			},
			meta: {
				label: "State",
				variant: "multiSelect" as const,
				options: opts.stateOptions,
			},
		},

		// Pod
		{
			accessorKey: "pod",
			enableSorting: true,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Pod" />
			),
			cell: ({ getValue }) => (
				<span className="text-sm">
					{(getValue() as string | null) ?? "\u2014"}
				</span>
			),
			meta: { label: "Pod" },
		},

		// Perf rating (from staff meta)
		{
			id: "perf",
			enableSorting: true,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Perf" />
			),
			accessorFn: (row) => opts.perfMap?.get(row.id) ?? null,
			cell: ({ row }) => {
				const rating = opts.perfMap?.get(row.original.id) ?? null;
				return <PerfBadge rating={rating} />;
			},
			meta: { label: "Performance" },
		},

		// Risk level (from attrition risks)
		{
			id: "risk",
			enableSorting: true,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Risk" />
			),
			accessorFn: (row) => opts.riskMap?.get(row.id) ?? null,
			cell: ({ row }) => {
				const level = opts.riskMap?.get(row.original.id) ?? null;
				return <RiskBadge level={level} />;
			},
			meta: { label: "Attrition Risk" },
		},
	);

	// Actions column — only for writers
	if (opts.canEdit) {
		columns.push({
			id: "actions",
			enableSorting: false,
			enableHiding: false,
			enableColumnFilter: false,
			size: 40,
			header: () => null,
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={(e) => {
						e.stopPropagation();
						opts.onEdit(row.original);
					}}
				>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
				</Button>
			),
		});
	}

	return columns;
}
