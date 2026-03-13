"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type * as React from "react";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

function PopoverTrigger({
	...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverPopup({
	children,
	className,
	side = "bottom",
	align = "center",
	sideOffset = 4,
	alignOffset = 0,
	...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	sideOffset?: number;
	alignOffset?: number;
}) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				className={cn(
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-4 text-text-strong-950 shadow-gray-shadow outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				data-slot="popover-popup"
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignOffset={alignOffset}
				{...props}
			>
				{children}
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	);
}

function PopoverClose({
	...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close>) {
	return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("font-semibold text-lg leading-none", className)}
			data-slot="popover-title"
			{...props}
		/>
	);
}

function PopoverDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("text-sm text-text-soft-400", className)}
			data-slot="popover-description"
			{...props}
		/>
	);
}

export {
	Popover,
	PopoverTrigger,
	PopoverPopup,
	PopoverPopup as PopoverContent,
	PopoverTitle,
	PopoverDescription,
	PopoverClose,
	PopoverPrimitive,
};
