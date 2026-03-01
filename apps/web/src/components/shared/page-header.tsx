import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ROUTE_CONFIG } from "@/lib/route-config";

interface PageHeaderProps {
	/** Override the static description from route-config */
	description?: ReactNode;
	/** Right-side actions (buttons, tabs, etc.) */
	children?: ReactNode;
}

/**
 * Shared page header — reads title & description from route-config.ts.
 * Pass `description` to override the static subtitle.
 * Pass `children` for right-side actions (buttons, tabs, etc.).
 */
export function PageHeader({ description, children }: PageHeaderProps) {
	const { pathname } = useLocation();
	// Strip the /_app prefix that TanStack Router uses internally
	const key = pathname.replace(/^\/_app/, "");
	const config = ROUTE_CONFIG[key];

	if (!config) return null;

	return (
		<div className="flex items-center justify-between border-border border-b px-6 py-4">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">{config.title}</h1>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{description ?? config.description}
				</p>
			</div>
			{children && <div className="flex items-center gap-3">{children}</div>}
		</div>
	);
}
