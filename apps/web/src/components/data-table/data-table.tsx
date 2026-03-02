import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type * as React from "react";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { getCommonPinningStyles } from "@/components/data-table/lib/data-table";
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
}

export function DataTable<TData>({
	actionBar,
	children,
	className,
	table,
	...props
}: DataTableProps<TData>) {
	return (
		<div
			className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
			{...props}
		>
			{children}

			<div className="overflow-hidden rounded-lg bg-white shadow-card">
				<Table>
					<TableHeader>
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
							table.getRowModel().rows.map((row) => (
								<TableRow
									data-state={row.getIsSelected() && "selected"}
									key={row.id}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											style={{
												...getCommonPinningStyles({ column: cell.column }),
											}}
										>
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
									className="h-24 text-center"
									colSpan={table.getAllColumns().length}
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-col gap-2.5">
				<DataTablePagination table={table} />

				{actionBar &&
					table.getFilteredSelectedRowModel().rows.length > 0 &&
					actionBar}
			</div>
		</div>
	);
}
