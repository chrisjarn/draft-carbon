import { PencilEdit01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { Option } from "@/components/data-table/types/data-table";
import { Button } from "@/components/ui/button";
import { fmtDollar } from "@/lib/format";

import { EditableCell, fmtPromoEta, PerfBadge, pct } from "./shared";
import type { StaffWithMeta } from "./types";

// ── Faceted filter function ───────────────────────────────────────────────────
// DataTableFacetedFilter sets column filter value as string[]
// We need a filterFn that checks if the row value is in the selected set

const arrIncludesFilter: FilterFn<StaffWithMeta> = (
	row,
	columnId,
	filterValue: string[],
) => {
	if (!filterValue || filterValue.length === 0) return true;
	const cellValue = row.getValue<string | null>(columnId);
	return cellValue != null && filterValue.includes(cellValue);
};

// Promo filter — "yes"/"maybe" are the options, but the data is promoFlag
const promoFilter: FilterFn<StaffWithMeta> = (
	row,
	_columnId,
	filterValue: string[],
) => {
	if (!filterValue || filterValue.length === 0) return true;
	const promoFlag = row.original.meta?.promoFlag ?? "no";
	return filterValue.includes(promoFlag);
};

// ── Option builders (called once with data to populate faceted filters) ───────

export function buildSlOptions(data: StaffWithMeta[]): Option[] {
	const counts = new Map<string, number>();
	for (const s of data) {
		if (s.sl) counts.set(s.sl, (counts.get(s.sl) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([value, count]) => ({ label: value, value, count }));
}

export function buildOfficeOptions(data: StaffWithMeta[]): Option[] {
	const counts = new Map<string, number>();
	for (const s of data) {
		if (s.office) counts.set(s.office, (counts.get(s.office) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([value, count]) => ({ label: value, value, count }));
}

export function buildTagOptions(data: StaffWithMeta[]): Option[] {
	const counts = new Map<string, number>();
	for (const s of data) {
		const tag = s.meta?.roleTag;
		if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([value, count]) => ({
			label: value.charAt(0).toUpperCase() + value.slice(1),
			value,
			count,
		}));
}

export function buildPromoOptions(data: StaffWithMeta[]): Option[] {
	const counts = new Map<string, number>();
	for (const s of data) {
		const flag = s.meta?.promoFlag ?? "no";
		counts.set(flag, (counts.get(flag) ?? 0) + 1);
	}
	const labels: Record<string, string> = {
		yes: "Yes",
		maybe: "Maybe",
		no: "No",
	};
	return ["yes", "maybe", "no"]
		.filter((v) => counts.has(v))
		.map((value) => ({
			label: labels[value] ?? value,
			value,
			count: counts.get(value),
		}));
}

// ── Column definitions ────────────────────────────────────────────────────────

interface StaffColumnsOpts {
	/** Called with carbonite id + patch for inline editable cells */
	onQuickUpsert: (cbId: string, patch: Record<string, string>) => void;
	/** Called to open the full edit dialog */
	onEdit: (staff: StaffWithMeta) => void;
	/** Whether the user can write (edit) data */
	canEdit: boolean;
	/** Pre-computed filter options (built from full dataset) */
	slOptions: Option[];
	officeOptions: Option[];
	tagOptions: Option[];
	promoOptions: Option[];
}

export function getStaffTableColumns(
	opts: StaffColumnsOpts,
): ColumnDef<StaffWithMeta>[] {
	const columns: ColumnDef<StaffWithMeta>[] = [
		{
			accessorKey: "name",
			enableSorting: true,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => (
				<span className="font-medium text-sm">{row.getValue("name")}</span>
			),
			size: 180,
			meta: { label: "Name" },
		},
		{
			id: "role",
			accessorFn: (row) => row.meta?.staffRole || row.role || null,
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
		{
			id: "tag",
			accessorFn: (row) => row.meta?.roleTag ?? null,
			enableSorting: false,
			filterFn: arrIncludesFilter,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Tag" />
			),
			cell: ({ getValue }) => {
				const tag = getValue() as string | null;
				return <span className="text-sm capitalize">{tag ?? "\u2014"}</span>;
			},
			meta: {
				label: "Tag",
				variant: "multiSelect" as const,
				options: opts.tagOptions,
			},
		},
		{
			accessorKey: "sl",
			enableSorting: true,
			filterFn: arrIncludesFilter,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="SL" />
			),
			cell: ({ getValue }) => (
				<span className="text-sm">
					{(getValue() as string | null) ?? "\u2014"}
				</span>
			),
			meta: {
				label: "Service Line",
				variant: "multiSelect" as const,
				options: opts.slOptions,
			},
		},
		{
			accessorKey: "office",
			enableSorting: true,
			filterFn: arrIncludesFilter,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Office" />
			),
			cell: ({ getValue }) => (
				<span className="text-sm">
					{(getValue() as string | null) ?? "\u2014"}
				</span>
			),
			meta: {
				label: "Office",
				variant: "multiSelect" as const,
				options: opts.officeOptions,
			},
		},
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
		{
			id: "target",
			accessorFn: (row) => row.meta?.billingTarget ?? null,
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const a = Number(rowA.original.meta?.billingTarget ?? 0);
				const b = Number(rowB.original.meta?.billingTarget ?? 0);
				return a - b;
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Target" />
			),
			cell: ({ row }) => (
				<EditableCell
					value={row.original.meta?.billingTarget}
					onSave={(v) =>
						opts.onQuickUpsert(row.original.id, { billingTarget: v })
					}
					disabled={!opts.canEdit}
				/>
			),
			meta: { label: "Target" },
		},
		{
			id: "actual",
			accessorFn: (row) => row.meta?.billingActual ?? null,
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const a = Number(rowA.original.meta?.billingActual ?? 0);
				const b = Number(rowB.original.meta?.billingActual ?? 0);
				return a - b;
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Actual" />
			),
			cell: ({ row }) => (
				<EditableCell
					value={row.original.meta?.billingActual}
					onSave={(v) =>
						opts.onQuickUpsert(row.original.id, { billingActual: v })
					}
					disabled={!opts.canEdit}
				/>
			),
			meta: { label: "Actual" },
		},
		{
			id: "attainment",
			accessorFn: (row) => {
				const a = Number(row.meta?.billingActual ?? 0);
				const t = Number(row.meta?.billingTarget ?? 0);
				if (!t || !a) return 0;
				return a / t;
			},
			enableSorting: true,
			enableColumnFilter: false,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Attainment" />
			),
			cell: ({ row }) => {
				const actual = row.original.meta?.billingActual ?? null;
				const target = row.original.meta?.billingTarget ?? null;
				const isGreen = Number(actual) >= Number(target) && target;
				return (
					<span
						className={`font-medium text-sm tabular-nums ${isGreen ? "text-green-400" : ""}`}
					>
						{pct(actual, target)}
					</span>
				);
			},
			meta: { label: "Attainment" },
		},
		{
			id: "perf",
			accessorFn: (row) => row.meta?.perfRating ?? "N/A",
			enableSorting: true,
			enableColumnFilter: false,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Perf" />
			),
			cell: ({ row }) => <PerfBadge rating={row.original.meta?.perfRating} />,
			meta: { label: "Performance" },
		},
		{
			id: "promo",
			accessorFn: (row) => row.meta?.promoFlag ?? "no",
			enableSorting: false,
			filterFn: promoFilter,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Promo" />
			),
			cell: ({ row }) => {
				const meta = row.original.meta;
				if (meta?.promoFlag === "yes" || meta?.promoFlag === "maybe") {
					return (
						<div className="flex items-center gap-1">
							<HugeiconsIcon
								icon={StarIcon}
								className={`size-3.5 ${meta.promoFlag === "yes" ? "fill-amber-400 text-amber-400" : "fill-amber-400/50 text-amber-400/50"}`}
							/>
							<span className="text-[10px] text-amber-400">
								{meta.promoFlag === "maybe" ? "Maybe" : ""}
								{meta.promoEta
									? meta.promoFlag === "maybe"
										? ` \u00B7 ${fmtPromoEta(meta.promoEta)}`
										: fmtPromoEta(meta.promoEta)
									: ""}
							</span>
						</div>
					);
				}
				return (
					<span className="text-muted-foreground/40 text-sm">{"\u2014"}</span>
				);
			},
			meta: {
				label: "Promotion",
				variant: "multiSelect" as const,
				options: opts.promoOptions,
			},
		},
	];

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
					size="sm"
					className="h-6 w-6 p-0"
					onClick={() => opts.onEdit(row.original)}
				>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
				</Button>
			),
		});
	}

	return columns;
}
