import { HugeiconsIcon } from "@hugeicons/react";
import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ROUTE_CONFIG } from "@/lib/route-config";

/**
 * Shared page header — icon circle + title + description from route-config.ts.
 * Pass `children` for right-side actions (e.g. Add button).
 * Pass `titleOverride` to replace the route-config title (e.g. greeting).
 */
export function PageHeader({
	children,
	titleOverride,
	constrain,
}: {
	children?: ReactNode;
	/** Custom title node — replaces the route-config title when provided. */
	titleOverride?: ReactNode;
	/** Tailwind max-w class — centers content to a max width (e.g. "max-w-[968px]"). */
	constrain?: string;
}) {
	const { pathname } = useLocation();
	const key = pathname.replace(/^\/_app/, "");
	const config = ROUTE_CONFIG[key];

	if (!config) return null;

	const inner = (
		<>
			<div className="flex items-center gap-3">
				{config.icon && (
					<div className="flex size-12 items-center justify-center rounded-full border border-stroke-soft-200">
						<HugeiconsIcon
							icon={config.icon}
							className="size-6 text-green-600/56"
						/>
					</div>
				)}
				<div className="flex flex-col gap-0.5">
					<h1 className="font-medium text-lg/snug text-text-strong-950 tracking-tight">
						{titleOverride ?? config.title}
					</h1>
					<p className="text-sm">{config.description}</p>
				</div>
			</div>
			{children && <div className="flex items-center gap-2">{children}</div>}
		</>
	);

	return (
		<div className="bg-bg-white-0 px-6 py-4">
			{constrain ? (
				<div
					className={`mx-auto flex w-full items-center justify-between ${constrain}`}
				>
					{inner}
				</div>
			) : (
				<div className="flex items-center justify-between">{inner}</div>
			)}
		</div>
	);
}
