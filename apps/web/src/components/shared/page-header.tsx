import { useLocation } from "@tanstack/react-router";

import { ROUTE_CONFIG } from "@/lib/route-config";

/**
 * Shared page header — reads title from route-config.ts.
 */
export function PageHeader() {
	const { pathname } = useLocation();
	const key = pathname.replace(/^\/_app/, "");
	const config = ROUTE_CONFIG[key];

	if (!config) return null;

	return (
		<div className="flex items-center justify-center border-sidebar-border border-b bg-sidebar px-6 py-2">
			<h1 className="font-medium text-base tracking-tight text-sidebar-foreground">
				{config.title}
			</h1>
		</div>
	);
}
