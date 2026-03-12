import type { ReactNode } from "react";

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
