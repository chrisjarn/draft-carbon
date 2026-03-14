import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import {
	buildOfficeOptions,
	buildPromoOptions,
	buildSlOptions,
	buildTagOptions,
	getStaffTableColumns,
} from "./staff-table-columns";
import type { StaffWithMeta } from "./types";

interface UseStaffDataTableOpts {
	data: StaffWithMeta[];
	onQuickUpsert: (cbId: string, patch: Record<string, string>) => void;
	onEdit: (staff: StaffWithMeta) => void;
	canEdit: boolean;
	attritionRiskMap?: Map<
		string,
		{
			riskLevel: string;
			score: number;
			factors: { label: string; impact: number }[];
		}
	>;
}

export function useStaffDataTable({
	data,
	onQuickUpsert,
	onEdit,
	canEdit,
	attritionRiskMap,
}: UseStaffDataTableOpts) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 50,
	});

	// Build filter options from the full dataset
	const slOptions = useMemo(() => buildSlOptions(data), [data]);
	const officeOptions = useMemo(() => buildOfficeOptions(data), [data]);
	const tagOptions = useMemo(() => buildTagOptions(data), [data]);
	const promoOptions = useMemo(() => buildPromoOptions(data), [data]);

	const stableRiskMap = useMemo(
		() =>
			attritionRiskMap ??
			new Map<
				string,
				{
					riskLevel: string;
					score: number;
					factors: { label: string; impact: number }[];
				}
			>(),
		[attritionRiskMap],
	);

	const columns = useMemo(
		() =>
			getStaffTableColumns({
				onQuickUpsert,
				onEdit,
				canEdit,
				slOptions,
				officeOptions,
				tagOptions,
				promoOptions,
				attritionRiskMap: stableRiskMap,
			}),
		[
			onQuickUpsert,
			onEdit,
			canEdit,
			slOptions,
			officeOptions,
			tagOptions,
			promoOptions,
			stableRiskMap,
		],
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			pagination,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return { table };
}
