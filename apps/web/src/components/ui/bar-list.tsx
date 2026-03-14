// Tremor BarList [v0.1.0] — ported to Carbon WFP

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type BarItem = {
	name: string;
	value: number;
	key?: string;
	href?: string;
};

interface BarListProps extends React.ComponentPropsWithoutRef<"div"> {
	data: BarItem[];
	valueFormatter?: (value: number) => string;
	showAnimation?: boolean;
	sortOrder?: "ascending" | "descending" | "none";
	color?: string;
}

export function BarList({
	data = [],
	valueFormatter = (v) => v.toString(),
	showAnimation = false,
	sortOrder = "descending",
	color = "bg-blue-200 dark:bg-blue-500/20",
	className,
	...props
}: BarListProps) {
	const sortedData = useMemo(() => {
		if (sortOrder === "none") return data;
		return [...data].sort((a, b) =>
			sortOrder === "ascending" ? a.value - b.value : b.value - a.value,
		);
	}, [data, sortOrder]);

	const widths = useMemo(() => {
		const maxValue = Math.max(...sortedData.map((item) => item.value), 0);
		return sortedData.map((item) =>
			item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 2),
		);
	}, [sortedData]);

	return (
		<div className={cn("flex justify-between space-x-6", className)} {...props}>
			{/* Bars */}
			<div className="relative w-full space-y-1.5">
				{sortedData.map((item, index) => (
					<div key={item.key ?? item.name} className="group w-full rounded">
						<div
							className={cn(
								"flex h-8 items-center rounded transition-all",
								color,
								showAnimation && "duration-800",
							)}
							style={{ width: `${widths[index]}%` }}
						>
							<div className="absolute left-2 flex max-w-full pr-2">
								{item.href ? (
									<a
										href={item.href}
										className="truncate whitespace-nowrap rounded text-sm hover:underline hover:underline-offset-2"
										target="_blank"
										rel="noreferrer"
									>
										{item.name}
									</a>
								) : (
									<p className="truncate whitespace-nowrap text-sm">
										{item.name}
									</p>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Values */}
			<div>
				{sortedData.map((item, index) => (
					<div
						key={item.key ?? item.name}
						className={cn(
							"flex h-8 items-center justify-end",
							index < sortedData.length - 1 && "mb-1.5",
						)}
					>
						<p className="truncate whitespace-nowrap text-sm tabular-nums leading-none">
							{valueFormatter(item.value)}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
