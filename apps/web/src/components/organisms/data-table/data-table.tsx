import {
	flexRender,
	type Row,
	type Table as TanstackTable,
} from "@tanstack/react-table";
import type * as React from "react";
import { DataTablePagination } from "@/components/organisms/data-table/data-table-pagination";
import { getCommonPinningStyles } from "@/components/organisms/data-table/lib/data-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
	actionBar?: React.ReactNode;
	table: TanstackTable<TData>;
	onRowClick?: (row: TData) => void;
	/**
	 * Render custom cells for a grouped row.
	 * Return a Record mapping visible column ids to ReactNode content.
	 * Columns not in the record render empty cells.
	 */
	renderGroupCells?: (row: Row<TData>) => Record<string, React.ReactNode>;
	footer?: React.ReactNode;
	/** Use table-layout: fixed with explicit column widths from column.getSize() */
	fixedLayout?: boolean;
	/** Optional extra className per leaf row */
	getRowClassName?: (row: Row<TData>) => string;
}

export function DataTable<TData>({
	actionBar,
	children,
	className,
	table,
	onRowClick,
	renderGroupCells,
	footer,
	fixedLayout,
	getRowClassName,
	...props
}: DataTableProps<TData>) {
	const showPagination = table.getPageCount() > 1;

	return (
		<div className={cn("flex w-full flex-col", className)} {...props}>
			{children}

			<div className="overflow-x-auto bg-bg-white-0">
				<Table className={fixedLayout ? "table-fixed" : undefined}>
					{fixedLayout && (
						<colgroup>
							{table.getVisibleFlatColumns().map((col) => (
								<col key={col.id} style={{ width: col.getSize() }} />
							))}
						</colgroup>
					)}
					<TableHeader className="sticky top-0 z-10 bg-bg-weak-50/80 backdrop-blur-sm">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										colSpan={header.colSpan}
										key={header.id}
										style={{
											...getCommonPinningStyles({ column: header.column }),
										}}
									>
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
							table.getRowModel().rows.map((row) => {
								if (row.getIsGrouped() && renderGroupCells) {
									const cellMap = renderGroupCells(row);
									return (
										<TableRow
											key={row.id}
											className="bg-bg-weak-50/60 font-semibold"
										>
											{table.getVisibleFlatColumns().map((col) => (
												<TableCell key={col.id}>
													{cellMap[col.id] ?? null}
												</TableCell>
											))}
										</TableRow>
									);
								}

								return (
									<TableRow
										data-state={row.getIsSelected() && "selected"}
										key={row.id}
										className={cn(
											onRowClick ? "cursor-pointer" : undefined,
											getRowClassName?.(row),
										)}
										onClick={() => onRowClick?.(row.original)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												style={{
													...getCommonPinningStyles({
														column: cell.column,
													}),
												}}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									className="h-24 text-center"
									colSpan={table.getVisibleFlatColumns().length}
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>

					{footer}
				</Table>
			</div>

			{showPagination && (
				<div className="border-t">
					<DataTablePagination table={table} />
				</div>
			)}

			{actionBar &&
				table.getFilteredSelectedRowModel().rows.length > 0 &&
				actionBar}
		</div>
	);
}
