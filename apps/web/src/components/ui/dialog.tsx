"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const DialogCreateHandle = undefined;

const Dialog = DialogPrimitive.Root;

const DialogPortal = DialogPrimitive.Portal;

function DialogTrigger(
	props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>,
) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(
	props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>,
) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				"fixed inset-0 z-50 bg-black/32 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				className,
			)}
			data-slot="dialog-backdrop"
			{...props}
		/>
	);
}

function DialogViewport({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"fixed inset-0 z-50 grid grid-rows-[1fr_auto_3fr] justify-items-center p-4",
				className,
			)}
			data-slot="dialog-viewport"
			{...props}
		/>
	);
}

function DialogPopup({
	className,
	children,
	showCloseButton = true,
	bottomStickOnMobile = true,
	closeProps,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
	bottomStickOnMobile?: boolean;
	closeProps?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;
}) {
	return (
		<DialogPortal>
			<DialogBackdrop />
			<DialogPrimitive.Content
				className={cn(
					"fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] flex max-h-[85vh] min-h-0 w-full min-w-0 max-w-lg flex-col bg-bg-white-0 rounded-2xl shadow-lg border border-stroke-soft-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					bottomStickOnMobile &&
						"max-sm:max-w-none max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-b-0",
					className,
				)}
				data-slot="dialog-popup"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close asChild {...closeProps}>
						<Button
							size="icon"
							variant="ghost"
							aria-label="Close"
							className="absolute end-2 top-2"
						>
							<HugeiconsIcon icon={Cancel01Icon} />
						</Button>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-6 in-[[data-slot=dialog-popup]:has([data-slot=dialog-panel])]:pb-3 max-sm:pb-4",
				className,
			)}
			data-slot="dialog-header"
			{...props}
		/>
	);
}

function DialogFooter({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"div"> & {
	variant?: "default" | "bare";
}) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end sm:rounded-b-[calc(var(--radius-2xl)-1px)]",
				variant === "default" && "border-t bg-bg-weak-50/72 py-4",
				variant === "bare" &&
					"in-[[data-slot=dialog-popup]:has([data-slot=dialog-panel])]:pt-3 pt-4 pb-6",
				className,
			)}
			data-slot="dialog-footer"
			{...props}
		/>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn(
				"font-heading font-semibold text-base leading-none",
				className,
			)}
			data-slot="dialog-title"
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn("text-text-soft-400 text-sm", className)}
			data-slot="dialog-description"
			{...props}
		/>
	);
}

function DialogPanel({
	className,
	scrollFade = true,
	...props
}: React.ComponentProps<"div"> & { scrollFade?: boolean }) {
	return (
		<ScrollArea scrollFade={scrollFade}>
			<div
				className={cn(
					"p-6 in-[[data-slot=dialog-popup]:has([data-slot=dialog-header])]:pt-1 in-[[data-slot=dialog-popup]:has([data-slot=dialog-footer]:not(.border-t))]:pb-1",
					className,
				)}
				data-slot="dialog-panel"
				{...props}
			/>
		</ScrollArea>
	);
}

export {
	DialogCreateHandle,
	Dialog,
	DialogTrigger,
	DialogPortal,
	DialogClose,
	DialogBackdrop,
	DialogBackdrop as DialogOverlay,
	DialogPopup,
	DialogPopup as DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	DialogPanel,
	DialogViewport,
	DialogPrimitive,
};
