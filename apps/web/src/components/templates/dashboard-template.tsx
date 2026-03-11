import type { ReactNode } from "react";
import { Page, PageBody } from "./page";

interface DashboardTemplateProps {
	/** The greeting/header section */
	greeting: ReactNode;
	/** Filter bar (state tabs + SL pills) */
	filters: ReactNode;
	/** Main content area */
	children: ReactNode;
}

/**
 * DashboardTemplate — layout shell for the dashboard page.
 *
 * Owns the dashboard-specific layout: padded scrollable body with
 * constrained width, filter bar with border separators, and content stack.
 *
 * Pages compose this template — they don't apply any spacing or bg classes.
 */
export function DashboardTemplate({
	greeting,
	filters,
	children,
}: DashboardTemplateProps) {
	return (
		<Page>
			<PageBody
				className="scrollbar-hide bg-zinc-50 px-6 pt-8 pb-6"
				constrain="max-w-[968px]"
			>
				{greeting}
				<div className="mb-5 flex flex-wrap items-center justify-between gap-y-2 border-border/60 border-y py-2.5">
					{filters}
				</div>
				<div className="flex flex-col gap-5">{children}</div>
			</PageBody>
		</Page>
	);
}

/**
 * DashboardSection — titled content section within the dashboard.
 */
export function DashboardSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<div>
			<h2 className="mb-4 font-semibold text-base">{title}</h2>
			{children}
		</div>
	);
}

/**
 * DashboardChartRow — 2-column chart grid.
 */
export function DashboardChartRow({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-2 gap-5">{children}</div>;
}
