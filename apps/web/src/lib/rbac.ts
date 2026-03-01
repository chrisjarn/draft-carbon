export const ROLE_RANKS: Record<string, number> = {
	admin: 100,
	practice_manager: 80,
	service_line_lead: 50,
	state_manager: 50,
	read_only: 10,
};

export const ROLE_LABELS: Record<string, string> = {
	admin: "Admin",
	practice_manager: "Practice Manager",
	service_line_lead: "Service Line Lead",
	state_manager: "State Manager",
	read_only: "View Only",
};

const WRITE_ROLES = [
	"admin",
	"practice_manager",
	"service_line_lead",
	"state_manager",
];
const ADMIN_WRITE_ROLES = ["admin", "practice_manager"];

export function canWrite(role: string | undefined | null): boolean {
	return WRITE_ROLES.includes(role ?? "");
}

export function canAdminWrite(role: string | undefined | null): boolean {
	return ADMIN_WRITE_ROLES.includes(role ?? "");
}

export function getRank(role: string | undefined | null): number {
	return ROLE_RANKS[role ?? "read_only"] ?? 10;
}

export function getUserRole(
	user: Record<string, unknown> | null | undefined,
): string {
	if (!user || typeof user !== "object") return "read_only";
	const role = (user as { role?: string }).role;
	return typeof role === "string" ? role : "read_only";
}
