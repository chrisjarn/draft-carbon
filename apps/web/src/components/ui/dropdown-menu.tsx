import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ArrowRight01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function DropdownMenu({
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Portal>) {
	return (
		<DropdownMenuPrimitive.Portal
			data-slot="dropdown-menu-portal"
			{...props}
		/>
	);
}

function DropdownMenuTrigger({
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>) {
	return (
		<DropdownMenuPrimitive.Trigger
			data-slot="dropdown-menu-trigger"
			{...props}
		/>
	);
}

function DropdownMenuContent({
	align = "start",
	alignOffset = 0,
	side = "bottom",
	sideOffset = 4,
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				className={cn(
					"bg-bg-white-0 shadow-gray-shadow rounded-lg border border-stroke-soft-200 p-1 z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-32 overflow-y-auto overflow-x-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuGroup({
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>) {
	return (
		<DropdownMenuPrimitive.Group
			data-slot="dropdown-menu-group"
			{...props}
		/>
	);
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.Label
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn(
				"px-2 py-2 text-text-soft-400 text-sm data-[inset]:pl-7",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"group/dropdown-menu-item relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden focus:bg-bg-weak-50 focus:text-text-sub-600 data-[disabled]:pointer-events-none data-[inset]:pl-7 data-[variant=destructive]:text-error-base data-[disabled]:opacity-50 data-[variant=destructive]:focus:bg-error-light [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:*:[svg]:text-error-base",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuSub({
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>) {
	return (
		<DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
	);
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.SubTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(
				"flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden focus:bg-bg-weak-50 focus:text-text-sub-600 data-[state=open]:bg-bg-weak-50 data-[inset]:pl-7 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{children}
			<HugeiconsIcon icon={ArrowRight01Icon} className="ml-auto" />
		</DropdownMenuPrimitive.SubTrigger>
	);
}

function DropdownMenuSubContent({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.SubContent
				data-slot="dropdown-menu-sub-content"
				className={cn(
					"bg-bg-white-0 shadow-gray-shadow rounded-lg border border-stroke-soft-200 p-1 z-50 min-w-[96px] overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	inset,
	...props
}: React.ComponentPropsWithoutRef<
	typeof DropdownMenuPrimitive.CheckboxItem
> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.CheckboxItem
			data-slot="dropdown-menu-checkbox-item"
			data-inset={inset}
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-hidden focus:bg-bg-weak-50 focus:text-text-sub-600 data-[disabled]:pointer-events-none data-[inset]:pl-7 data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			checked={checked}
			{...props}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-checkbox-item-indicator"
			>
				<DropdownMenuPrimitive.ItemIndicator>
					<HugeiconsIcon icon={Tick01Icon} />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
}

function DropdownMenuRadioGroup({
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>) {
	return (
		<DropdownMenuPrimitive.RadioGroup
			data-slot="dropdown-menu-radio-group"
			{...props}
		/>
	);
}

function DropdownMenuRadioItem({
	className,
	children,
	inset,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.RadioItem
			data-slot="dropdown-menu-radio-item"
			data-inset={inset}
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-hidden focus:bg-bg-weak-50 focus:text-text-sub-600 data-[disabled]:pointer-events-none data-[inset]:pl-7 data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-radio-item-indicator"
			>
				<DropdownMenuPrimitive.ItemIndicator>
					<HugeiconsIcon icon={Tick01Icon} />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("-mx-1 h-px bg-stroke-soft-200", className)}
			{...props}
		/>
	);
}

function DropdownMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="dropdown-menu-shortcut"
			className={cn(
				"ml-auto text-text-soft-400 text-sm tracking-widest",
				className,
			)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
};
