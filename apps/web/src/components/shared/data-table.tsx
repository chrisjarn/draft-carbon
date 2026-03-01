import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
	columns: ColumnDef<TData, unknown>[];
	data: TData[];
	pageSize?: number;
	searchPlaceholder?: string;
	onRowClick?: (row: TData) => void;
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	emptyMessage?: string;
}

export function DataTable<TData>({
	columns,
	data,
	pageSize = 10,
	searchPlaceholder = "Search...",
	onRowClick,
	rowSelection: rowSelectionProp,
	onRowSelectionChange,
	emptyMessage = "No results.",
}: DataTableProps<TData>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [internalRowSelection, setInternalRowSelection] =
		useState<RowSelectionState>({});
	const [globalFilter, setGlobalFilter] = useState("");

	const rowSelection = rowSelectionProp ?? internalRowSelection;
	const setRowSelection = onRowSelectionChange ?? setInternalRowSelection;

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
		state: {
			sorting,
			rowSelection,
			globalFilter,
		},
		initialState: {
			pagination: { pageSize },
		},
	});

	const pageCount = table.getPageCount();
	const currentPage = table.getState().pagination.pageIndex + 1;

	return (
		<div className="w-full space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">Show</span>
					<Select
						value={String(table.getState().pagination.pageSize)}
						onValueChange={(value) => table.setPageSize(Number(value))}
					>
						<SelectTrigger className="h-8 w-16">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[5, 10, 20, 50].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span className="text-muted-foreground text-sm">entries</span>
				</div>
				<Input
					placeholder={searchPlaceholder}
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="h-8 w-full sm:w-64"
				/>
			</div>

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={onRowClick ? "cursor-pointer" : undefined}
									onClick={() => onRowClick?.(row.original)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{pageCount > 1 && (
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-pretty text-muted-foreground text-sm">
						Showing{" "}
						{table.getState().pagination.pageIndex *
							table.getState().pagination.pageSize +
							1}{" "}
						to{" "}
						{Math.min(
							(table.getState().pagination.pageIndex + 1) *
								table.getState().pagination.pageSize,
							table.getFilteredRowModel().rows.length,
						)}{" "}
						of {table.getFilteredRowModel().rows.length} entries
					</p>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							aria-label="Previous page"
						>
							<HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
						</Button>
						{Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
							<Button
								key={page}
								variant={currentPage === page ? "default" : "outline"}
								size="icon"
								className="h-8 w-8"
								onClick={() => table.setPageIndex(page - 1)}
								aria-label={`Go to page ${page}`}
							>
								{page}
							</Button>
						))}
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							aria-label="Next page"
						>
							<HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
