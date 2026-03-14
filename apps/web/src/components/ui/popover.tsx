"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

const PopoverCreateHandle = PopoverPrimitive.createHandle;

const Popover = PopoverPrimitive.Root;

function PopoverTrigger({
	className,
	children,
	...props
}: PopoverPrimitive.Trigger.Props) {
	return (
		<PopoverPrimitive.Trigger
			className={className}
			data-slot="popover-trigger"
			{...props}
		>
			{children}
		</PopoverPrimitive.Trigger>
	);
}

function PopoverPopup({
	children,
	className,
	side = "bottom",
	align = "center",
	sideOffset = 4,
	alignOffset = 0,
	anchor,
	...props
}: PopoverPrimitive.Popup.Props & {
	side?: PopoverPrimitive.Positioner.Props["side"];
	align?: PopoverPrimitive.Positioner.Props["align"];
	sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"];
	alignOffset?: PopoverPrimitive.Positioner.Props["alignOffset"];
	anchor?: PopoverPrimitive.Positioner.Props["anchor"];
}) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				anchor={anchor}
				className="z-50"
				data-slot="popover-positioner"
				side={side}
				sideOffset={sideOffset}
			>
				<PopoverPrimitive.Popup
					className={cn(
						"w-72 rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-4 text-text-strong-950 shadow-gray-shadow outline-none transition-[scale,opacity] data-starting-style:scale-98 data-starting-style:opacity-0",
						className,
					)}
					data-slot="popover-popup"
					{...props}
				>
					{children}
				</PopoverPrimitive.Popup>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
	return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
	return (
		<PopoverPrimitive.Title
			className={cn("font-semibold text-lg leading-none", className)}
			data-slot="popover-title"
			{...props}
		/>
	);
}

function PopoverDescription({
	className,
	...props
}: PopoverPrimitive.Description.Props) {
	return (
		<PopoverPrimitive.Description
			className={cn("text-sm text-text-soft-400", className)}
			data-slot="popover-description"
			{...props}
		/>
	);
}

export {
	PopoverCreateHandle,
	Popover,
	PopoverTrigger,
	PopoverPopup,
	PopoverPopup as PopoverContent,
	PopoverTitle,
	PopoverDescription,
	PopoverClose,
	PopoverPrimitive,
};
