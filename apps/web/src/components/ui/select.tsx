"use client";

import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	ArrowUpDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const selectTriggerVariants = cva(
	"relative inline-flex min-h-9 w-full min-w-36 select-none items-center justify-between gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-[calc(--spacing(3)-1px)] text-left text-base text-text-strong-950 shadow-custom-input outline-none transition-[box-shadow,border-color,background-color] duration-200 ease-out pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-10 hover:bg-bg-weak-50 hover:shadow-none focus:border-primary-base focus:bg-bg-white-0 focus:shadow-[var(--shadow-block-custom-input-active)] data-[state=open]:border-primary-base data-[state=open]:bg-bg-white-0 data-[state=open]:shadow-[var(--shadow-block-custom-input-active)] aria-invalid:border-error-base data-[disabled]:pointer-events-none data-[disabled]:opacity-64 sm:min-h-10 sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		defaultVariants: {
			size: "default",
		},
		variants: {
			size: {
				default: "",
				lg: "min-h-10 sm:min-h-9",
				sm: "min-h-10 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:min-h-7",
			},
		},
	},
);

const selectTriggerIconClassName = "-me-1 size-4.5 opacity-80 sm:size-4";

interface SelectButtonProps extends React.ComponentPropsWithoutRef<"button"> {
	size?: VariantProps<typeof selectTriggerVariants>["size"];
}

const SelectButton = React.forwardRef<HTMLButtonElement, SelectButtonProps>(
	({ className, size, children, ...props }, ref) => (
		<button
			ref={ref}
			className={cn(selectTriggerVariants({ size }), "min-w-0", className)}
			data-slot="select-button"
			type="button"
			{...props}
		>
			<span className="flex-1 truncate data-[placeholder]:text-text-disabled-300">
				{children}
			</span>
			<HugeiconsIcon
				icon={ArrowUpDownIcon}
				className={selectTriggerIconClassName}
			/>
		</button>
	),
);
SelectButton.displayName = "SelectButton";

function SelectTrigger({
	className,
	size = "default",
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
	VariantProps<typeof selectTriggerVariants>) {
	return (
		<SelectPrimitive.Trigger
			className={cn(selectTriggerVariants({ size }), className)}
			data-slot="select-trigger"
			{...props}
		>
			{children}
			<SelectPrimitive.Icon data-slot="select-icon">
				<HugeiconsIcon
					icon={ArrowUpDownIcon}
					className={selectTriggerIconClassName}
				/>
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectValue({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>) {
	return (
		<SelectPrimitive.Value
			className={cn(
				"flex-1 truncate data-[placeholder]:text-text-disabled-300",
				className,
			)}
			data-slot="select-value"
			{...props}
		/>
	);
}

function SelectPopup({
	className,
	children,
	side = "bottom",
	sideOffset = 4,
	align = "start",
	position = "popper",
	...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				className={cn(
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-white-0 shadow-gray-shadow data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				data-slot="select-popup"
				side={side}
				sideOffset={sideOffset}
				align={align}
				position={position}
				{...props}
			>
				<SelectPrimitive.ScrollUpButton className="flex h-6 w-full cursor-default items-center justify-center">
					<HugeiconsIcon
						icon={ArrowUp01Icon}
						className="relative size-4.5 sm:size-4"
					/>
				</SelectPrimitive.ScrollUpButton>
				<SelectPrimitive.Viewport className={cn("p-1", className)}>
					{children}
				</SelectPrimitive.Viewport>
				<SelectPrimitive.ScrollDownButton className="flex h-6 w-full cursor-default items-center justify-center">
					<HugeiconsIcon
						icon={ArrowDown01Icon}
						className="relative size-4.5 sm:size-4"
					/>
				</SelectPrimitive.ScrollDownButton>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectItem({
	className,
	children,
	label: _label,
	...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
	label?: string;
}) {
	return (
		<SelectPrimitive.Item
			className={cn(
				"grid min-h-10 cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-base outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-bg-weak-50 data-[highlighted]:text-text-sub-600 data-[disabled]:opacity-64 sm:min-h-7 sm:text-sm [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-slot="select-item"
			{...props}
		>
			<SelectPrimitive.ItemIndicator className="col-start-1">
				<svg
					fill="none"
					height="24"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					viewBox="0 0 24 24"
					width="24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
				</svg>
			</SelectPrimitive.ItemIndicator>
			<SelectPrimitive.ItemText className="col-start-2 min-w-0">
				{children}
			</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			className={cn("mx-2 my-1 h-px bg-stroke-soft-200", className)}
			data-slot="select-separator"
			{...props}
		/>
	);
}

function SelectGroup(
	props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>,
) {
	return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectGroupLabel(
	props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>,
) {
	return (
		<SelectPrimitive.Label
			className="px-2 py-1.5 font-medium text-text-soft-400 text-xs"
			data-slot="select-group-label"
			{...props}
		/>
	);
}

export {
	Select,
	SelectTrigger,
	SelectButton,
	selectTriggerVariants,
	SelectValue,
	SelectPopup,
	SelectPopup as SelectContent,
	SelectItem,
	SelectSeparator,
	SelectGroup,
	SelectGroupLabel,
	SelectPrimitive,
};
