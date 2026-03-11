/**
 * AppDialog — standardized dialog wrapper with a `size` prop.
 *
 * Eliminates per-site max-w-* overrides on DialogContent. All dialog sizing
 * is decided here; pages only pass a semantic size name.
 *
 * size:  "sm" → max-w-sm   (small forms, confirms)
 *        "md" → max-w-md   (medium forms)
 *        "lg" → max-w-lg   (large forms, tables)
 *        omit → shadcn default (sm:max-w-lg)
 *
 * Re-exports all Dialog sub-components as App* aliases so callers only
 * need this one import instead of two.
 */
import type { ReactNode } from "react";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const sizeClass = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
} satisfies Record<string, string>;

type AppDialogSize = keyof typeof sizeClass;

interface AppDialogContentProps
	extends Omit<React.ComponentProps<typeof DialogContent>, "className"> {
	size?: AppDialogSize;
	className?: string;
	children: ReactNode;
}

function AppDialogContent({
	size,
	className,
	children,
	...props
}: AppDialogContentProps) {
	return (
		<DialogContent
			className={cn(size && sizeClass[size], className)}
			{...props}
		>
			{children}
		</DialogContent>
	);
}

// Re-export primitives under App* names — callers only need this one import.
export {
	Dialog as AppDialog,
	DialogTrigger as AppDialogTrigger,
	AppDialogContent,
	DialogHeader as AppDialogHeader,
	DialogFooter as AppDialogFooter,
	DialogTitle as AppDialogTitle,
	DialogDescription as AppDialogDescription,
	DialogClose as AppDialogClose,
};
