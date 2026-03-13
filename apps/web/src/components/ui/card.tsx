"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div"> & {
		size?: "default" | "sm";
		flushFooter?: boolean;
	}
>(({ className, size = "default", flushFooter, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"relative flex flex-col rounded-20 shadow-custom-input bg-bg-white-0 not-dark:bg-clip-padding text-card-foreground",
			size === "sm" && "rounded-xl",
			flushFooter && "[&>[data-slot=card-footer]]:p-0",
			className,
		)}
		data-slot="card"
		data-size={size}
		{...props}
	/>
));
Card.displayName = "Card";

const CardFrame = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"relative flex flex-col rounded-2xl bg-bg-white-0 not-dark:bg-clip-padding text-card-foreground [--clip-bottom:-1rem] [--clip-top:-1rem] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:bg-bg-weak-50/72 *:data-[slot=card]:-m-px *:not-first:data-[slot=card]:rounded-t-xl *:not-last:data-[slot=card]:rounded-b-xl *:data-[slot=card]:bg-clip-padding *:data-[slot=card]:shadow-none *:data-[slot=card]:before:hidden *:not-first:data-[slot=card]:before:rounded-t-[calc(var(--radius-xl)-1px)] *:not-last:data-[slot=card]:before:rounded-b-[calc(var(--radius-xl)-1px)] *:data-[slot=card]:[clip-path:inset(var(--clip-top)_1px_var(--clip-bottom)_1px_round_calc(var(--radius-2xl)-1px))] *:data-[slot=card]:last:[--clip-bottom:1px] *:data-[slot=card]:first:[--clip-top:1px]",
			className,
		)}
		data-slot="card-frame"
		{...props}
	/>
));
CardFrame.displayName = "CardFrame";

const CardFrameHeader = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"relative flex grid auto-rows-min grid-rows-[auto_auto] flex-col items-start gap-x-4 bg-bg-weak-50 px-6 py-4 has-data-[slot=card-frame-action]:grid-cols-[1fr_auto]",
			className,
		)}
		data-slot="card-frame-header"
		{...props}
	/>
));
CardFrameHeader.displayName = "CardFrameHeader";

const CardFrameTitle = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("font-semibold text-sm", className)}
		data-slot="card-frame-title"
		{...props}
	/>
));
CardFrameTitle.displayName = "CardFrameTitle";

const CardFrameDescription = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("text-text-soft-400 text-sm", className)}
		data-slot="card-frame-description"
		{...props}
	/>
));
CardFrameDescription.displayName = "CardFrameDescription";

const CardFrameAction = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"col-start-2 row-span-2 row-start-1 inline-flex self-center justify-self-end",
			className,
		)}
		data-slot="card-frame-action"
		{...props}
	/>
));
CardFrameAction.displayName = "CardFrameAction";

const CardFrameFooter = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("bg-bg-weak-50 px-6 py-4", className)}
		data-slot="card-frame-footer"
		{...props}
	/>
));
CardFrameFooter.displayName = "CardFrameFooter";

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pb-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
			className,
		)}
		data-slot="card-header"
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("font-semibold text-lg leading-none", className)}
		data-slot="card-title"
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("text-text-soft-400 text-sm", className)}
		data-slot="card-description"
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

const CardAction = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end",
			className,
		)}
		data-slot="card-action"
		{...props}
	/>
));
CardAction.displayName = "CardAction";

const CardPanel = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex-1 p-6 in-[[data-slot=card]:has(>[data-slot=card-header]:not(.border-b))]:pt-0 in-[[data-slot=card]:has(>[data-slot=card-footer]:not(.border-t))]:pb-0",
			className,
		)}
		data-slot="card-panel"
		{...props}
	/>
));
CardPanel.displayName = "CardPanel";

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex items-center p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pt-4",
			className,
		)}
		data-slot="card-footer"
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

/* ─── CardStatBar ──────────────────────────────────────────────────────── */

type CardStat = {
	label: string;
	value: string | number;
	align?: "left" | "center" | "right";
};

function CardStatBar({ stats }: { stats: CardStat[] }) {
	return (
		<div
			data-slot="card-footer"
			className="flex items-center divide-x border-t text-sm"
		>
			{stats.map((stat) => (
				<div
					key={stat.label}
					className={cn("flex flex-1 flex-col items-center gap-0.5 px-2 py-2")}
				>
					<span className="font-bold text-base tracking-tighter">
						{stat.value}
					</span>
					<span className="text-text-soft-400">{stat.label}</span>
				</div>
			))}
		</div>
	);
}

export {
	Card,
	CardFrame,
	CardFrameHeader,
	CardFrameTitle,
	CardFrameDescription,
	CardFrameAction,
	CardFrameFooter,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardPanel,
	CardPanel as CardContent,
	CardStatBar,
	CardTitle,
};
