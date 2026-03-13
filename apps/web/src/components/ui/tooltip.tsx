"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipCreateHandle = undefined;

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip({
	delayDuration = 0,
	...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
	return <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />;
}

function TooltipTrigger({
	...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & {
	asChild?: boolean;
}) {
	return (
		<TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
	);
}

function TooltipPopup({
	className,
	side = "top",
	align = "center",
	sideOffset = 4,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				className={cn(
					"bg-bg-surface-800 text-text-white-0 rounded-lg px-2 py-1 text-xs font-medium z-50 shadow-md data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
					className,
				)}
				data-slot="tooltip-popup"
				side={side}
				align={align}
				sideOffset={sideOffset}
				{...props}
			>
				{children}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}

export {
	TooltipCreateHandle,
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipPopup,
	TooltipPopup as TooltipContent,
	TooltipPrimitive,
};
