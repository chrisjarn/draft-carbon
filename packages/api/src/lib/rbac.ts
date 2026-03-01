import type { auth } from "@carbon-wfp/auth";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import { TRPCError } from "@trpc/server";
import { eq, type SQL, sql } from "drizzle-orm";

type SessionUser = typeof auth.$Infer.Session.user;

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

// ── RBAC query-level filtering ──────────────────────────────────────────────

export type RoleFilter = {
	state?: string;
	serviceLine?: string;
};

/**
 * Returns filter constraints based on the user's role and assignments.
 * - admin / practice_manager → no filter (full access)
 * - state_manager → filter by assigned state
 * - service_line_lead → filter by assigned service line
 * - read_only → no filter (read access to everything, writes blocked elsewhere)
 */
export function getRoleFilter(user: SessionUser): RoleFilter {
	const role = user.role ?? "read_only";
	if (role === "admin" || role === "practice_manager") return {};
	if (role === "state_manager" && user.assignedState) {
		return { state: user.assignedState };
	}
	if (role === "service_line_lead" && user.assignedServiceLine) {
		return { serviceLine: user.assignedServiceLine };
	}
	return {};
}

/**
 * Returns a Drizzle WHERE condition to filter the `carbonites` table by role.
 * Returns `undefined` when no filtering is needed (can be spread into `and()`).
 */
export function carboniteRoleWhere(filter: RoleFilter): SQL | undefined {
	if (filter.state) return eq(carbonites.state, filter.state);
	if (filter.serviceLine) return eq(carbonites.sl, filter.serviceLine);
	return undefined;
}

/**
 * Returns a Drizzle WHERE condition to filter the `entities` table by role.
 * For state filtering, matches `entities.state`.
 * For service line filtering, checks if the JSON `sl` array contains the value.
 */
export function entityRoleWhere(filter: RoleFilter): SQL | undefined {
	if (filter.state) return eq(entities.state, filter.state);
	if (filter.serviceLine) {
		// entities.sl is a JSON array — use SQL containment check
		return sql`${entities.sl}::jsonb @> ${JSON.stringify([filter.serviceLine])}::jsonb`;
	}
	return undefined;
}
