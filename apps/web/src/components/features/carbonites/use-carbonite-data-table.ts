import {
	type ColumnFiltersState,
	type FilterFn,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import {
	buildCarboniteOfficeOptions,
	buildCarboniteSlOptions,
	buildCarboniteStateOptions,
	buildCarboniteTypeOptions,
	getCarboniteTableColumns,
} from "./carbonite-table-columns";
import type { Carbonite } from "./types";

// ── Global filter (searches name, role, pod) ─────────────────────────────────

const globalFilterFn: FilterFn<Carbonite> = (row, _columnId, filterValue) => {
	if (!filterValue || typeof filterValue !== "string") return true;
	const q = filterValue.toLowerCase();
	const name = (row.original.name ?? "").toLowerCase();
	const role = (row.original.role ?? "").toLowerCase();
	const pod = (row.original.pod ?? "").toLowerCase();
	return name.includes(q) || role.includes(q) || pod.includes(q);
};

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseCarboniteDataTableOpts {
	data: Carbonite[];
	onEdit: (carbonite: Carbonite) => void;
	canEdit: boolean;
	initialSearch?: string;
	perfMap?: Map<string, string | null>;
	riskMap?: Map<string, string | null>;
}

export function useCarboniteDataTable({
	data,
	onEdit,
	canEdit,
	initialSearch = "",
	perfMap,
	riskMap,
}: UseCarboniteDataTableOpts) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState(initialSearch);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 50,
	});

	// Build filter options from the full dataset
	const slOptions = useMemo(() => buildCarboniteSlOptions(data), [data]);
	const stateOptions = useMemo(() => buildCarboniteStateOptions(data), [data]);
	const officeOptions = useMemo(
		() => buildCarboniteOfficeOptions(data),
		[data],
	);
	const typeOptions = useMemo(() => buildCarboniteTypeOptions(data), [data]);

	const columns = useMemo(
		() =>
			getCarboniteTableColumns({
				onEdit,
				canEdit,
				slOptions,
				stateOptions,
				officeOptions,
				typeOptions,
				perfMap,
				riskMap,
			}),
		[
			onEdit,
			canEdit,
			slOptions,
			stateOptions,
			officeOptions,
			typeOptions,
			perfMap,
			riskMap,
		],
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			columnVisibility,
			rowSelection,
			pagination,
		},
		enableRowSelection: canEdit,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		globalFilterFn,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return { table, globalFilter, setGlobalFilter };
}
