import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ROUTE_CONFIG } from "@/lib/route-config";

/**
 * Shared page header — left-aligned title + description from route-config.ts.
 * Pass `children` for right-side actions (e.g. Add button).
 * Pass `titleOverride` to replace the route-config title (e.g. greeting).
 */
export function PageHeader({
	children,
	titleOverride,
}: {
	children?: ReactNode;
	/** Custom title node — replaces the route-config title when provided. */
	titleOverride?: ReactNode;
}) {
	const { pathname } = useLocation();
	const key = pathname.replace(/^\/_app/, "");
	const config = ROUTE_CONFIG[key];

	if (!config) return null;

	return (
		<div className="flex items-center justify-between bg-white px-6 py-3">
			<h1 className="font-medium text-base tracking-tight">
				{titleOverride ?? config.title}
			</h1>
			{children && <div className="flex items-center gap-2">{children}</div>}
		</div>
	);
}
