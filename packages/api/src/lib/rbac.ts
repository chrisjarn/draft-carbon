import { TRPCError } from "@trpc/server";

export const WRITE_ROLES = [
	"admin",
	"practice_manager",
	"service_line_lead",
	"state_manager",
] as const;

export const ADMIN_WRITE_ROLES = ["admin", "practice_manager"] as const;

export const VALID_ROLES = [
	"admin",
	"practice_manager",
	"service_line_lead",
	"state_manager",
	"read_only",
] as const;

export type Role = (typeof VALID_ROLES)[number];

export function getUserRole(
	user: Record<string, unknown> | null | undefined,
): string {
	if (!user || typeof user !== "object") return "read_only";
	const role = (user as { role?: string }).role;
	return typeof role === "string" ? role : "read_only";
}

export function assertWriter(
	user: Record<string, unknown> | null | undefined,
	roles: readonly string[] = WRITE_ROLES,
): void {
	const role = getUserRole(user);
	if (!roles.includes(role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Insufficient permissions",
		});
	}
}

export function assertAdmin(
	user: Record<string, unknown> | null | undefined,
): void {
	if (getUserRole(user) !== "admin") {
		throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
	}
}
