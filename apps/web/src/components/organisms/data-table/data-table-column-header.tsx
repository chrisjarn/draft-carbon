import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	Cancel01Icon,
	Sorting05Icon,
	ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Column } from "@tanstack/react-table";
import type * as React from "react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
	extends React.ComponentProps<typeof DropdownMenuTrigger> {
	column: Column<TData, TValue>;
	title: string;
}

export function DataTableColumnHeader<TData, TValue>({
	className,
	column,
	title,
	...props
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort() && !column.getCanHide()) {
		return (
			<div className={cn("flex items-center", className)}>
				<span className="line-clamp-2 max-w-[200px] whitespace-normal break-words">
					{title}
				</span>
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={cn(
					"-ml-1.5 flex h-10 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-bg-weak-50 focus:outline-none focus:ring-1 focus:ring-stroke-strong-950 data-[state=open]:bg-bg-weak-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-text-soft-400",
					className,
				)}
				{...props}
			>
				<span className="line-clamp-2 max-w-[200px] whitespace-normal break-words">
					{title}
				</span>
				{column.getCanSort() &&
					(column.getIsSorted() === "desc" ? (
						<HugeiconsIcon icon={ArrowDown01Icon} />
					) : column.getIsSorted() === "asc" ? (
						<HugeiconsIcon icon={ArrowUp01Icon} />
					) : (
						<HugeiconsIcon icon={Sorting05Icon} />
					))}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-28">
				{column.getCanSort() && (
					<>
						<DropdownMenuCheckboxItem
							checked={column.getIsSorted() === "asc"}
							className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-text-soft-400"
							onClick={() => column.toggleSorting(false)}
						>
							<HugeiconsIcon icon={ArrowUp01Icon} />
							Asc
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={column.getIsSorted() === "desc"}
							className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-text-soft-400"
							onClick={() => column.toggleSorting(true)}
						>
							<HugeiconsIcon icon={ArrowDown01Icon} />
							Desc
						</DropdownMenuCheckboxItem>
						{column.getIsSorted() && (
							<DropdownMenuItem
								className="pl-2 [&_svg]:text-text-soft-400"
								onClick={() => column.clearSorting()}
							>
								<HugeiconsIcon icon={Cancel01Icon} />
								Reset
							</DropdownMenuItem>
						)}
					</>
				)}
				{column.getCanHide() && (
					<DropdownMenuCheckboxItem
						checked={!column.getIsVisible()}
						className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-text-soft-400"
						onClick={() => column.toggleVisibility(false)}
					>
						<HugeiconsIcon icon={ViewOffIcon} />
						Hide
					</DropdownMenuCheckboxItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
