export const ROLE_RANKS: Record<string, number> = {
	admin: 100,
	practice_manager: 80,
	sl_lead: 50,
	state_manager: 50,
	readonly: 10,
};

export const ROLE_LABELS: Record<string, string> = {
	admin: "Admin",
	practice_manager: "Practice Manager",
	sl_lead: "SL Lead",
	state_manager: "State Manager",
	readonly: "View Only",
};

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];
const ADMIN_WRITE_ROLES = ["admin", "practice_manager"];

export function canWrite(role: string | undefined | null): boolean {
	return WRITE_ROLES.includes(role ?? "");
}

export function canAdminWrite(role: string | undefined | null): boolean {
	return ADMIN_WRITE_ROLES.includes(role ?? "");
}

export function getRank(role: string | undefined | null): number {
	return ROLE_RANKS[role ?? "readonly"] ?? 10;
}

export function getUserRole(
	user: Record<string, unknown> | null | undefined,
): string {
	if (!user || typeof user !== "object") return "readonly";
	const role = (user as { role?: string }).role;
	return typeof role === "string" ? role : "readonly";
}
