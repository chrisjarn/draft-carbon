import type { RouterOutputs } from "@/utils/trpc";

// ── User types ────────────────────────────────────────────────────────────────

export type AppUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	assignedState: string | null;
	assignedServiceLine: string | null;
	emailVerified: boolean;
	createdAt: string;
};

export type ValidRole =
	| "admin"
	| "practice_manager"
	| "service_line_lead"
	| "state_manager"
	| "read_only";

// ── Entity types ──────────────────────────────────────────────────────────────

export type Entity = RouterOutputs["entities"]["getAll"][number];

// ── Role config ───────────────────────────────────────────────────────────────

export const ROLES: { value: ValidRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "practice_manager", label: "Practice Manager" },
	{ value: "service_line_lead", label: "Service Line Lead" },
	{ value: "state_manager", label: "State Manager" },
	{ value: "read_only", label: "View Only" },
];

export const ROLE_STYLES: Record<string, string> = {
	admin: "border-purple-500/40 bg-purple-500/10 text-purple-400",
	practice_manager: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	service_line_lead: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
	state_manager: "border-teal-500/40 bg-teal-500/10 text-teal-400",
	read_only: " bg-muted/40 text-muted-foreground",
};
