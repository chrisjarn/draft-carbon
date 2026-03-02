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
		<div className="flex items-center border-border border-b bg-white px-6 py-3">
			<h1 className="font-medium text-lg tracking-tight">
				{config.title}
			</h1>
		</div>
	);
}
