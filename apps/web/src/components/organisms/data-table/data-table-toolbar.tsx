import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Column, Table } from "@tanstack/react-table";
import * as React from "react";
import { DataTableFacetedFilter } from "@/components/organisms/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/organisms/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
	table: Table<TData>;
}

export function DataTableToolbar<TData>({
	children,
	className,
	table,
	...props
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	const columns = React.useMemo(
		() => table.getAllColumns().filter((column) => column.getCanFilter()),
		[table],
	);

	const onReset = React.useCallback(() => {
		table.resetColumnFilters();
	}, [table]);

	return (
		<div
			aria-orientation="horizontal"
			className={cn(
				"flex w-full items-start justify-between gap-2 p-1",
				className,
			)}
			role="toolbar"
			{...props}
		>
			<div className="flex flex-1 flex-wrap items-center gap-2">
				{columns.map((column) => (
					<DataTableToolbarFilter column={column} key={column.id} />
				))}
				{isFiltered && (
					<Button
						aria-label="Reset filters"
						className="border-dashed"
						onClick={onReset}
						variant="outline"
					>
						<HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
						Reset
					</Button>
				)}
			</div>
			<div className="flex items-center gap-2">
				{children}
				<DataTableViewOptions table={table} />
			</div>
		</div>
	);
}

function DataTableToolbarFilter<TData>({ column }: { column: Column<TData> }) {
	const columnMeta = column.columnDef.meta;

	const onFilterRender = React.useCallback(() => {
		if (!columnMeta?.variant) return null;

		switch (columnMeta.variant) {
			case "multiSelect":
			case "select":
				return (
					<DataTableFacetedFilter
						column={column}
						multiple={columnMeta.variant === "multiSelect"}
						options={columnMeta.options ?? []}
						title={columnMeta.label ?? column.id}
					/>
				);

			case "number":
				return (
					<div className="relative">
						<Input
							className={cn("w-[120px]", columnMeta.unit && "pr-8")}
							inputMode="numeric"
							onChange={(event) => column.setFilterValue(event.target.value)}
							placeholder={columnMeta.placeholder ?? columnMeta.label}
							type="number"
							value={column.getFilterValue() as string}
						/>
						{columnMeta.unit && (
							<span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
								{columnMeta.unit}
							</span>
						)}
					</div>
				);

			case "text":
				return (
					<Input
						className="w-40 lg:w-56"
						onChange={(event) => column.setFilterValue(event.target.value)}
						placeholder={columnMeta.placeholder ?? columnMeta.label}
						value={column.getFilterValue() as string}
					/>
				);

			default:
				return null;
		}
	}, [column, columnMeta]);

	return onFilterRender();
}
