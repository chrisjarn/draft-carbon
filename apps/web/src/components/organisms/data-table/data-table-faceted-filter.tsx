import {
	CancelCircleIcon,
	PlusSignCircleIcon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Column } from "@tanstack/react-table";
import * as React from "react";
import type { Option } from "@/components/organisms/data-table/types/data-table";
import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableFacetedFilterProps<TData, TValue> {
	column?: Column<TData, TValue>;
	multiple?: boolean;
	options: Option[];
	title?: string;
}

export function DataTableFacetedFilter<TData, TValue>({
	column,
	multiple,
	options,
	title,
}: DataTableFacetedFilterProps<TData, TValue>) {
	const [open, setOpen] = React.useState(false);

	const columnFilterValue = column?.getFilterValue();
	const selectedValues = React.useMemo(
		() => new Set(Array.isArray(columnFilterValue) ? columnFilterValue : []),
		[columnFilterValue],
	);

	const onItemSelect = React.useCallback(
		(option: Option, isSelected: boolean) => {
			if (!column) return;

			if (multiple) {
				const newSelectedValues = new Set(selectedValues);
				if (isSelected) {
					newSelectedValues.delete(option.value);
				} else {
					newSelectedValues.add(option.value);
				}
				const filterValues = Array.from(newSelectedValues);
				column.setFilterValue(filterValues.length ? filterValues : undefined);
			} else {
				column.setFilterValue(isSelected ? undefined : [option.value]);
				setOpen(false);
			}
		},
		[column, multiple, selectedValues],
	);

	const onReset = React.useCallback(
		(event?: React.MouseEvent) => {
			event?.stopPropagation();
			column?.setFilterValue(undefined);
		},
		[column],
	);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-bg-white-0 px-2.5 font-medium text-sm transition-colors hover:bg-bg-weak-50 hover:text-text-sub-600">
				{selectedValues.size > 0 ? (
					<button
						type="button"
						aria-label={`Clear ${title} filter`}
						className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
						onClick={onReset}
					>
						<HugeiconsIcon icon={CancelCircleIcon} className="size-4" />
					</button>
				) : (
					<HugeiconsIcon icon={PlusSignCircleIcon} className="size-4" />
				)}
				{title}
				{selectedValues.size > 0 && (
					<>
						<Separator
							className="mx-0.5 data-[orientation=vertical]:h-4"
							orientation="vertical"
						/>
						<Badge
							className="rounded-sm px-1 font-normal lg:hidden"
							variant="secondary"
						>
							{selectedValues.size}
						</Badge>
						<div className="hidden items-center gap-1 lg:flex">
							{selectedValues.size > 2 ? (
								<Badge
									className="rounded-sm px-1 font-normal"
									variant="secondary"
								>
									{selectedValues.size} selected
								</Badge>
							) : (
								options
									.filter((option) => selectedValues.has(option.value))
									.map((option) => (
										<Badge
											className="rounded-sm px-1 font-normal"
											key={option.value}
											variant="secondary"
										>
											{option.label}
										</Badge>
									))
							)}
						</div>
					</>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[12.5rem] p-0">
				<Command>
					<CommandInput placeholder={title} />
					<CommandList className="max-h-full">
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup className="max-h-[18.75rem] overflow-y-auto overflow-x-hidden">
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value);

								return (
									<CommandItem
										key={option.value}
										onSelect={() => onItemSelect(option, isSelected)}
									>
										<div
											className={cn(
												"flex size-4 items-center justify-center rounded-sm border border-green-600",
												isSelected
													? "bg-green-600"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<HugeiconsIcon icon={Tick01Icon} className="size-3" />
										</div>
										<span className="truncate">{option.label}</span>
										{option.count != null && (
											<span className="ml-auto font-mono text-xs">
												{option.count}
											</span>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										className="justify-center text-center"
										onSelect={() => onReset()}
									>
										Clear filters
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
