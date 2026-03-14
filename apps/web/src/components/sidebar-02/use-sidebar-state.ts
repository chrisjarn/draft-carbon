import { useState } from "react";

const STORAGE_KEY = "wfp:sidebar-collapsed";

function readCollapsed(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === "true";
	} catch {
		return false;
	}
}

export function useSidebarState() {
	const [isCollapsed, setIsCollapsed] = useState<boolean>(readCollapsed);
	const [isMobileOpen, setMobileOpen] = useState(false);

	function toggle() {
		setIsCollapsed((prev) => {
			const next = !prev;
			try {
				localStorage.setItem(STORAGE_KEY, String(next));
			} catch {
				// ignore
			}
			return next;
		});
	}

	return { isCollapsed, toggle, isMobileOpen, setMobileOpen };
}
