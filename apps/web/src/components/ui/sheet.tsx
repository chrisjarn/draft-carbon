"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetPortal = SheetPrimitive.Portal;

function SheetTrigger(
	props: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>,
) {
	return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(
	props: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>,
) {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetBackdrop({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>) {
	return (
		<SheetPrimitive.Overlay
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/32 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			data-slot="sheet-backdrop"
			{...props}
		/>
	);
}

const sheetSizeClass = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-4xl",
} as const;

type SheetSize = keyof typeof sheetSizeClass;

function SheetPopup({
	className,
	children,
	showCloseButton = true,
	side = "right",
	variant = "default",
	size,
	closeProps,
	...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
	showCloseButton?: boolean;
	side?: "right" | "left" | "top" | "bottom";
	variant?: "default" | "inset";
	size?: SheetSize;
	closeProps?: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>;
}) {
	return (
		<SheetPortal>
			<SheetBackdrop />
			<SheetPrimitive.Content
				className={cn(
					"fixed z-50 flex max-h-full min-h-0 w-full min-w-0 flex-col bg-bg-white-0 shadow-lg transition-transform duration-200 ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in",
					side === "bottom" &&
						"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 border-t",
					side === "top" &&
						"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 border-b",
					side === "left" &&
						`inset-y-0 left-0 w-[calc(100%-(--spacing(12)))] ${sheetSizeClass[size ?? "md"]} data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left border-e`,
					side === "right" &&
						`inset-y-0 right-0 w-[calc(100%-(--spacing(12)))] ${sheetSizeClass[size ?? "md"]} data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right border-s`,
					variant === "inset" &&
						"sm:rounded-2xl sm:border sm:**:data-[slot=sheet-footer]:rounded-b-[calc(var(--radius-2xl)-1px)]",
					className,
				)}
				data-slot="sheet-popup"
				{...props}
			>
				{children}
				{showCloseButton && (
					<SheetPrimitive.Close asChild {...closeProps}>
						<Button
							size="icon"
							variant="ghost"
							aria-label="Close"
							className="absolute end-2 top-2"
						>
							<HugeiconsIcon icon={Cancel01Icon} />
						</Button>
					</SheetPrimitive.Close>
				)}
			</SheetPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-6 in-[[data-slot=sheet-popup]:has([data-slot=sheet-panel])]:pb-3 max-sm:pb-4",
				className,
			)}
			data-slot="sheet-header"
			{...props}
		/>
	);
}

function SheetFooter({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"div"> & {
	variant?: "default" | "bare";
}) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end",
				variant === "default" && "border-t bg-bg-weak-50/72 py-4",
				variant === "bare" &&
					"in-[[data-slot=sheet-popup]:has([data-slot=sheet-panel])]:pt-3 pt-4 pb-6",
				className,
			)}
			data-slot="sheet-footer"
			{...props}
		/>
	);
}

function SheetTitle({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>) {
	return (
		<SheetPrimitive.Title
			className={cn(
				"font-heading font-semibold text-xl leading-none",
				className,
			)}
			data-slot="sheet-title"
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>) {
	return (
		<SheetPrimitive.Description
			className={cn("text-sm text-text-soft-400", className)}
			data-slot="sheet-description"
			{...props}
		/>
	);
}

function SheetPanel({
	className,
	scrollFade = true,
	...props
}: React.ComponentProps<"div"> & { scrollFade?: boolean }) {
	return (
		<ScrollArea scrollFade={scrollFade}>
			<div
				className={cn(
					"p-6 in-[[data-slot=sheet-popup]:has([data-slot=sheet-header])]:pt-1 in-[[data-slot=sheet-popup]:has([data-slot=sheet-footer]:not(.border-t))]:pb-1",
					className,
				)}
				data-slot="sheet-panel"
				{...props}
			/>
		</ScrollArea>
	);
}

export {
	Sheet,
	SheetTrigger,
	SheetPortal,
	SheetClose,
	SheetBackdrop,
	SheetBackdrop as SheetOverlay,
	SheetPopup,
	SheetPopup as SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
	SheetPanel,
	SheetPrimitive,
};
