import {
	Briefcase01Icon,
	Calendar01Icon,
	ChartLineData02Icon,
	DashboardSquare01Icon,
	FlowSquareIcon,
	Location04Icon,
	Search01Icon,
	Settings01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { authClient } from "@/lib/auth-client";
import { STATES } from "@/lib/constants";
import { getRank, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

// ── Nav items (mirrors sidebar) ───────────────────────────────────────────────

const NAV_PAGES = [
	{ to: "/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
	{ to: "/capacity-plan", label: "Capacity Plan", icon: ChartLineData02Icon },
	{ to: "/carbonites", label: "Carbonites", icon: UserGroupIcon },
	{ to: "/hiring", label: "Hiring", icon: Briefcase01Icon },
	{ to: "/scenarios", label: "Scenarios", icon: FlowSquareIcon },
	{ to: "/fy-planning", label: "FY Report", icon: Calendar01Icon },
] as const;

const ADMIN_PAGES = [
	{ to: "/admin", label: "Settings", icon: Settings01Icon },
] as const;

// ── Hook for debounced value ──────────────────────────────────────────────────

function useDebouncedValue(value: string, delay: number) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return debounced;
}

// ── Command Palette ───────────────────────────────────────────────────────────

export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const navigate = useNavigate();

	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const isAdmin = getRank(userRole) >= 100;

	// Debounce the search query for carbonite lookup
	const debouncedQuery = useDebouncedValue(query, 200);
	const shouldSearch = debouncedQuery.length >= 2;

	const carboniteSearch = useQuery({
		...trpc.carbonites.getAll.queryOptions({ search: debouncedQuery }),
		enabled: shouldSearch && open,
	});
	const carbonites = shouldSearch
		? (carboniteSearch.data ?? []).slice(0, 8)
		: [];

	// ── Keyboard shortcut ─────────────────────────────────────────────────
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	// Reset query when dialog closes
	useEffect(() => {
		if (!open) setQuery("");
	}, [open]);

	const go = useCallback(
		(to: string, search?: Record<string, string>) => {
			setOpen(false);
			void navigate({ to, search: search as Record<string, unknown> });
		},
		[navigate],
	);

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title="Command Palette"
			description="Search or jump to..."
			showCloseButton={false}
			className="top-[40%] max-w-[560px] overflow-hidden rounded-lg border border-border/60 shadow-lg supports-backdrop-filter:backdrop-blur-sm md:left-[calc(50%+8rem)]"
		>
			<Command shouldFilter={!shouldSearch} loop>
				<CommandInput
					placeholder="Search or jump to..."
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>

					{/* ── Carbonite search results ─────────────────────── */}
					{carbonites.length > 0 && (
						<>
							<CommandGroup heading="People">
								{carbonites.map((c) => (
									<CommandItem
										key={c.id}
										value={`person-${c.name}`}
										onSelect={() => go("/carbonites", { search: c.name })}
									>
										<div className="flex size-6 items-center justify-center rounded-full bg-muted font-medium text-[10px] text-muted-foreground">
											{c.name
												.split(/\s+/)
												.map((p) => p[0])
												.join("")
												.slice(0, 2)
												.toUpperCase()}
										</div>
										<span className="flex-1 truncate">{c.name}</span>
										<span className="text-muted-foreground text-xs">
											{c.role ?? ""} {c.office ? `· ${c.office}` : ""}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
							<CommandSeparator />
						</>
					)}

					{/* ── Page navigation ──────────────────────────────── */}
					<CommandGroup heading="Pages">
						{NAV_PAGES.map((page) => (
							<CommandItem
								key={page.to}
								value={`page-${page.label}`}
								onSelect={() => go(page.to)}
							>
								<HugeiconsIcon
									icon={page.icon}
									className="size-4 text-muted-foreground"
								/>
								{page.label}
							</CommandItem>
						))}
						{isAdmin &&
							ADMIN_PAGES.map((page) => (
								<CommandItem
									key={page.to}
									value={`page-${page.label}`}
									onSelect={() => go(page.to)}
								>
									<HugeiconsIcon
										icon={page.icon}
										className="size-4 text-muted-foreground"
									/>
									{page.label}
								</CommandItem>
							))}
					</CommandGroup>

					<CommandSeparator />

					{/* ── Quick state filter ───────────────────────────── */}
					<CommandGroup heading="Jump to State">
						{STATES.map((s) => (
							<CommandItem
								key={s.id}
								value={`state-${s.name}`}
								onSelect={() => go("/dashboard", { state: s.id })}
							>
								<HugeiconsIcon
									icon={Location04Icon}
									className="size-4 text-muted-foreground"
								/>
								<span className="flex-1">{s.name}</span>
								<span className="font-mono text-muted-foreground text-xs">
									{s.abbr}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	);
}

// ── Fake search bar trigger (used in dashboard header) ────────────────────────

export function SearchBarTrigger({ className }: { className?: string }) {
	return (
		<button
			type="button"
			onClick={() => {
				// Dispatch the same keyboard event the palette listens for
				document.dispatchEvent(
					new KeyboardEvent("keydown", {
						key: "k",
						metaKey: true,
						bubbles: true,
					}),
				);
			}}
			className={`group inline-flex h-10 w-full max-w-sm items-center gap-2.5 rounded-full bg-zinc-100 px-3.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-zinc-200/70 ${className ?? ""}`}
		>
			<HugeiconsIcon
				icon={Search01Icon}
				className="size-4 shrink-0 opacity-50"
			/>
			<span className="flex-1 text-left text-sm opacity-60">
				Search or jump to...
			</span>
			<kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 font-medium font-mono text-[11px] text-muted-foreground/70 sm:inline-flex">
				<span className="text-xs">⌘</span>K
			</kbd>
		</button>
	);
}
