import type { auth } from "@carbon-wfp/auth";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import type { SL_VALUES, STATE_VALUES } from "@carbon-wfp/db/schema/enums";
import { hiringNeeds } from "@carbon-wfp/db/schema/hiring-needs";
import { TRPCError } from "@trpc/server";
import { eq, type SQL, sql } from "drizzle-orm";

/** SQL predicate that always evaluates to false — used as a deny-all filter. */
const SQL_DENY_ALL = sql`1 = 0`;

type State = (typeof STATE_VALUES)[number];
type ServiceLine = (typeof SL_VALUES)[number];

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
	/** When true, all role-where helpers return a SQL deny-all predicate. */
	denyAll?: boolean;
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
	if (role === "state_manager") {
		if (!user.assignedState) {
			// Scoped role without assignment — fail closed with deny-all predicate
			return { denyAll: true };
		}
		return { state: user.assignedState };
	}
	if (role === "service_line_lead") {
		if (!user.assignedServiceLine) {
			return { denyAll: true };
		}
		return { serviceLine: user.assignedServiceLine };
	}
	return {};
}

/**
 * Returns a Drizzle WHERE condition to filter the `carbonites` table by role.
 * Returns `undefined` when no filtering is needed (can be spread into `and()`).
 */
export function carboniteRoleWhere(filter: RoleFilter): SQL | undefined {
	if (filter.denyAll) return SQL_DENY_ALL;
	if (filter.state) return eq(carbonites.state, filter.state as State);
	if (filter.serviceLine)
		return eq(carbonites.sl, filter.serviceLine as ServiceLine);
	return undefined;
}

/**
 * Returns a Drizzle WHERE condition to filter the `entities` table by role.
 * For state filtering, matches `entities.state`.
 * For service line filtering, checks if the JSON `sl` array contains the value.
 */
export function entityRoleWhere(filter: RoleFilter): SQL | undefined {
	if (filter.denyAll) return SQL_DENY_ALL;
	if (filter.state) return eq(entities.state, filter.state as State);
	if (filter.serviceLine) {
		// entities.sl is a JSON array — use SQL containment check
		return sql`${entities.sl}::jsonb @> ${JSON.stringify([filter.serviceLine])}::jsonb`;
	}
	return undefined;
}

/**
 * Returns a Drizzle WHERE condition to filter the `hiring_needs` table by role.
 */
export function hiringRoleWhere(filter: RoleFilter): SQL | undefined {
	if (filter.state) return eq(hiringNeeds.state, filter.state as State);
	if (filter.serviceLine)
		return eq(hiringNeeds.sl, filter.serviceLine as ServiceLine);
	return undefined;
}

/**
 * Asserts that a resource (carbonite, hiring need, etc.) is within the caller's
 * role scope. Pass the relevant scoping fields from the resource row.
 * Throws FORBIDDEN if the resource is out of scope.
 */
export function assertResourceScope(
	user: SessionUser,
	resource: { state?: string | null; sl?: string | null },
): void {
	const role = user.role ?? "read_only";
	if (role === "admin" || role === "practice_manager") return;
	if (role === "state_manager") {
		if (!user.assignedState) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "State manager has no assigned state",
			});
		}
		if (resource.state && resource.state !== user.assignedState) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Resource is outside your assigned state",
			});
		}
		return;
	}
	if (role === "service_line_lead") {
		if (!user.assignedServiceLine) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Service line lead has no assigned service line",
			});
		}
		if (resource.sl && resource.sl !== user.assignedServiceLine) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Resource is outside your assigned service line",
			});
		}
		return;
	}
}

/**
 * Asserts that an entity (with JSON array `sl` field) is within the caller's role scope.
 */
export function assertEntityScope(
	user: SessionUser,
	entity: { state?: string | null; sl?: unknown },
): void {
	const role = user.role ?? "read_only";
	if (role === "admin" || role === "practice_manager") return;
	if (role === "state_manager") {
		if (!user.assignedState) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "State manager has no assigned state",
			});
		}
		if (entity.state && entity.state !== user.assignedState) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Entity is outside your assigned state",
			});
		}
		return;
	}
	if (role === "service_line_lead") {
		if (!user.assignedServiceLine) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Service line lead has no assigned service line",
			});
		}
		const sls = Array.isArray(entity.sl) ? entity.sl : [];
		if (sls.length > 0 && !sls.includes(user.assignedServiceLine)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Entity is outside your assigned service line",
			});
		}
		return;
	}
}
