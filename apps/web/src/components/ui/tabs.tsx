"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

type TabsVariant = "default" | "underline" | "pill";

function Tabs({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			className={cn(
				"flex flex-col gap-2 data-[orientation=vertical]:flex-row",
				className,
			)}
			data-slot="tabs"
			{...props}
		/>
	);
}

function TabsList({
	variant = "default",
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
	variant?: TabsVariant;
}) {
	return (
		<TabsPrimitive.List
			className={cn(
				"relative z-0 flex w-fit items-center justify-center gap-x-0.5 text-text-soft-400",
				"data-[orientation=vertical]:flex-col",
				variant === "default"
					? "bg-bg-weak-50 rounded-lg p-0.5"
					: variant === "pill"
						? "gap-2 bg-bg-weak-50 rounded-full p-0.5"
						: "border-b border-stroke-soft-200 gap-0",
				className,
			)}
			data-slot="tabs-list"
			data-variant={variant}
			{...props}
		>
			{children}
		</TabsPrimitive.List>
	);
}

function TabsTab({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"relative flex h-8 shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 font-medium text-sm outline-none transition-[color,background-color,box-shadow] text-text-soft-400 hover:text-text-sub-600 focus-visible:ring-2 focus-visible:ring-stroke-strong-950 data-[disabled]:pointer-events-none data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-[state=active]:text-text-strong-950 data-[state=active]:font-medium data-[disabled]:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
				"in-data-[variant=default]:data-[state=active]:bg-bg-white-0 in-data-[variant=default]:data-[state=active]:shadow-sm",
				"in-data-[variant=underline]:data-[state=active]:border-b-2 in-data-[variant=underline]:data-[state=active]:border-stroke-strong-950",
				"in-data-[variant=pill]:rounded-full in-data-[variant=pill]:px-3 in-data-[variant=pill]:text-sm in-data-[variant=pill]:data-[state=active]:bg-text-strong-950 in-data-[variant=pill]:data-[state=active]:text-text-white-0",
				className,
			)}
			data-slot="tabs-tab"
			{...props}
		/>
	);
}

function TabsPanel({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			className={cn("flex-1 outline-none", className)}
			data-slot="tabs-content"
			{...props}
		/>
	);
}

export {
	Tabs,
	TabsList,
	TabsTab,
	TabsTab as TabsTrigger,
	TabsPanel,
	TabsPanel as TabsContent,
	TabsPrimitive,
};
