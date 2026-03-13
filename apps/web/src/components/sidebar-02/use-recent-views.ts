import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "wfp:recent-views";
const MAX_ENTRIES = 5;

export type RecentView = {
	label: string;
	to: string;
};

const ROUTE_LABELS: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/capacity-plan": "Capacity Plan",
	"/carbonites": "Carbonites",
	"/hiring": "Hiring",
	"/scenarios": "Scenarios",
	"/fy-planning": "FY Report",
	"/admin": "Settings",
};

function labelForPathname(pathname: string): string | undefined {
	// Exact match first
	if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
	// Prefix match
	for (const [route, label] of Object.entries(ROUTE_LABELS)) {
		if (pathname.startsWith(route) && route !== "/dashboard") return label;
	}
	return undefined;
}

function readViews(): RecentView[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as RecentView[];
	} catch {
		return [];
	}
}

function writeViews(views: RecentView[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
	} catch {
		// ignore
	}
}

export function useRecentViews() {
	const [recentViews, setRecentViews] = useState<RecentView[]>(readViews);
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	useEffect(() => {
		const label = labelForPathname(pathname);
		if (!label) return;

		setRecentViews((prev) => {
			const deduped = prev.filter((v) => v.to !== pathname);
			const next = [{ label, to: pathname }, ...deduped].slice(0, MAX_ENTRIES);
			writeViews(next);
			return next;
		});
	}, [pathname]);

	return recentViews;
}
