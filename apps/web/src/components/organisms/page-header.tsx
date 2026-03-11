import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ROUTE_CONFIG } from "@/lib/route-config";

/**
 * Shared page header — left-aligned title + description from route-config.ts.
 * Pass `children` for right-side actions (e.g. Add button).
 */
export function PageHeader({
	children,
	description,
}: {
	children?: ReactNode;
	description?: ReactNode;
}) {
	const { pathname } = useLocation();
	const key = pathname.replace(/^\/_app/, "");
	const config = ROUTE_CONFIG[key];

	if (!config) return null;

	return (
		<div className="flex items-center justify-between border-b bg-zinc-50 px-6 py-4">
			<div className="flex flex-col gap-0.5">
				<h1 className="font-semibold text-xl tracking-tight">{config.title}</h1>
				<p className="text-muted-foreground text-xs">
					{description ?? config.description}
				</p>
			</div>
			{children && <div className="flex items-center gap-2">{children}</div>}
		</div>
	);
}
