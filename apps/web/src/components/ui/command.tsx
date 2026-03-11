import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Command as CommandPrimitive } from "cmdk";
import type * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandDialog({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	className,
	showCloseButton = false,
	...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Dialog {...props}>
			<DialogContent
				className={cn("overflow-hidden rounded-lg p-0", className)}
				showCloseButton={showCloseButton}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			data-slot="command-input-wrapper"
			className="flex items-center gap-2 border-b px-3"
		>
			<HugeiconsIcon
				icon={Search01Icon}
				className="size-4 shrink-0 opacity-50"
			/>
			<CommandPrimitive.Input
				data-slot="command-input"
				className={cn(
					"flex h-10 w-full bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				"no-scrollbar max-h-72 scroll-py-0 overflow-y-auto overflow-x-hidden outline-none",
				className,
			)}
			{...props}
		/>
	);
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn("py-6 text-center text-sm", className)}
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"overflow-hidden text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn("-mx-1 h-px bg-border", className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"group/command-item relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-selected:bg-muted data-selected:text-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{children}
		</CommandPrimitive.Item>
	);
}

function CommandShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn(
				"ml-auto text-muted-foreground text-sm tracking-widest",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
};
