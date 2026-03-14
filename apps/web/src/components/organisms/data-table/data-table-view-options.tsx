import {
	Settings01Icon,
	Sorting05Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Table } from "@tanstack/react-table";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>;
}

export function DataTableViewOptions<TData>({
	table,
}: DataTableViewOptionsProps<TData>) {
	const columns = React.useMemo(
		() =>
			table
				.getAllColumns()
				.filter(
					(column) => column.accessorFn !== undefined && column.getCanHide(),
				),
		[table],
	);

	return (
		<Popover>
			<PopoverTrigger className="ml-auto hidden h-10 items-center gap-1.5 rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 font-medium text-sm shadow-xs transition-colors hover:bg-bg-weak-50 hover:text-text-sub-600 lg:inline-flex">
				<HugeiconsIcon icon={Settings01Icon} className="size-4" />
				View
				<HugeiconsIcon
					icon={Sorting05Icon}
					className="ml-auto size-4 opacity-50"
				/>
			</PopoverTrigger>

			<PopoverContent align="end" className="w-44 p-0">
				<Command>
					<CommandInput placeholder="Search columns..." />

					<CommandList>
						<CommandEmpty>No columns found.</CommandEmpty>

						<CommandGroup>
							{columns.map((column) => (
								<CommandItem
									key={column.id}
									onSelect={() =>
										column.toggleVisibility(!column.getIsVisible())
									}
								>
									<span className="truncate">
										{column.columnDef.meta?.label ?? column.id}
									</span>

									<HugeiconsIcon
										icon={Tick01Icon}
										className={cn(
											"ml-auto size-4 shrink-0",
											column.getIsVisible() ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
