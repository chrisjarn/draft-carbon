import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
	ADMIN_WRITE_ROLES,
	assertAdmin,
	assertEntityScope,
	assertResourceScope,
	assertWriter,
	getRoleFilter,
	getUserRole,
	type RoleFilter,
} from "../rbac";

describe("getUserRole", () => {
	it("returns 'read_only' for null user", () => {
		expect(getUserRole(null)).toBe("read_only");
	});

	it("returns 'read_only' for undefined user", () => {
		expect(getUserRole(undefined)).toBe("read_only");
	});

	it("returns 'read_only' when user has no role property", () => {
		expect(getUserRole({ name: "Alice" })).toBe("read_only");
	});

	it("returns 'read_only' when role is not a string", () => {
		expect(getUserRole({ role: 42 })).toBe("read_only");
	});

	it("returns the role string for a valid user", () => {
		expect(getUserRole({ role: "admin" })).toBe("admin");
		expect(getUserRole({ role: "practice_manager" })).toBe("practice_manager");
		expect(getUserRole({ role: "service_line_lead" })).toBe(
			"service_line_lead",
		);
		expect(getUserRole({ role: "state_manager" })).toBe("state_manager");
		expect(getUserRole({ role: "read_only" })).toBe("read_only");
	});
});

describe("assertWriter", () => {
	it("throws FORBIDDEN for read_only role", () => {
		expect(() => assertWriter({ role: "read_only" })).toThrow(TRPCError);
		try {
			assertWriter({ role: "read_only" });
		} catch (e) {
			expect(e).toBeInstanceOf(TRPCError);
			expect((e as TRPCError).code).toBe("FORBIDDEN");
		}
	});

	it("throws FORBIDDEN for null user", () => {
		expect(() => assertWriter(null)).toThrow(TRPCError);
	});

	it("throws FORBIDDEN for undefined user", () => {
		expect(() => assertWriter(undefined)).toThrow(TRPCError);
	});

	it("does not throw for admin", () => {
		expect(() => assertWriter({ role: "admin" })).not.toThrow();
	});

	it("does not throw for practice_manager", () => {
		expect(() => assertWriter({ role: "practice_manager" })).not.toThrow();
	});

	it("does not throw for service_line_lead", () => {
		expect(() => assertWriter({ role: "service_line_lead" })).not.toThrow();
	});

	it("does not throw for state_manager", () => {
		expect(() => assertWriter({ role: "state_manager" })).not.toThrow();
	});

	it("uses custom roles parameter (ADMIN_WRITE_ROLES)", () => {
		expect(() =>
			assertWriter({ role: "admin" }, ADMIN_WRITE_ROLES),
		).not.toThrow();
		expect(() =>
			assertWriter({ role: "practice_manager" }, ADMIN_WRITE_ROLES),
		).not.toThrow();
		expect(() =>
			assertWriter({ role: "service_line_lead" }, ADMIN_WRITE_ROLES),
		).toThrow(TRPCError);
		expect(() =>
			assertWriter({ role: "state_manager" }, ADMIN_WRITE_ROLES),
		).toThrow(TRPCError);
	});
});

describe("assertAdmin", () => {
	it("throws FORBIDDEN for non-admin roles", () => {
		for (const role of [
			"read_only",
			"practice_manager",
			"service_line_lead",
			"state_manager",
		]) {
			expect(() => assertAdmin({ role })).toThrow(TRPCError);
			try {
				assertAdmin({ role });
			} catch (e) {
				expect((e as TRPCError).code).toBe("FORBIDDEN");
				expect((e as TRPCError).message).toBe("Admin only");
			}
		}
	});

	it("throws FORBIDDEN for null user", () => {
		expect(() => assertAdmin(null)).toThrow(TRPCError);
	});

	it("does not throw for admin", () => {
		expect(() => assertAdmin({ role: "admin" })).not.toThrow();
	});
});

// ── getRoleFilter ───────────────────────────────────────────────────────────

function mockUser(
	overrides: Partial<{
		role: string;
		assignedState: string | null;
		assignedServiceLine: string | null;
	}> = {},
) {
	return {
		id: "u1",
		name: "Test",
		email: "test@test.com",
		emailVerified: false,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		role: "read_only",
		assignedState: null,
		assignedServiceLine: null,
		...overrides,
	};
}

describe("getRoleFilter", () => {
	it("returns empty filter for admin", () => {
		const filter: RoleFilter = getRoleFilter(mockUser({ role: "admin" }));
		expect(filter).toEqual({});
	});

	it("returns empty filter for practice_manager", () => {
		const filter = getRoleFilter(mockUser({ role: "practice_manager" }));
		expect(filter).toEqual({});
	});

	it("returns state filter for state_manager with assignedState", () => {
		const filter = getRoleFilter(
			mockUser({ role: "state_manager", assignedState: "qld" }),
		);
		expect(filter).toEqual({ state: "qld" });
	});

	it("returns empty filter for state_manager without assignedState", () => {
		const filter = getRoleFilter(
			mockUser({ role: "state_manager", assignedState: null }),
		);
		expect(filter).toEqual({});
	});

	it("returns serviceLine filter for service_line_lead with assignedServiceLine", () => {
		const filter = getRoleFilter(
			mockUser({ role: "service_line_lead", assignedServiceLine: "acc" }),
		);
		expect(filter).toEqual({ serviceLine: "acc" });
	});

	it("returns empty filter for service_line_lead without assignedServiceLine", () => {
		const filter = getRoleFilter(
			mockUser({ role: "service_line_lead", assignedServiceLine: null }),
		);
		expect(filter).toEqual({});
	});

	it("returns empty filter for read_only", () => {
		const filter = getRoleFilter(mockUser({ role: "read_only" }));
		expect(filter).toEqual({});
	});
});

// ── assertResourceScope ─────────────────────────────────────────────────────

describe("assertResourceScope", () => {
	it("allows admin to access any resource", () => {
		expect(() =>
			assertResourceScope(mockUser({ role: "admin" }), {
				state: "qld",
				sl: "tax",
			}),
		).not.toThrow();
	});

	it("allows practice_manager to access any resource", () => {
		expect(() =>
			assertResourceScope(mockUser({ role: "practice_manager" }), {
				state: "qld",
				sl: "tax",
			}),
		).not.toThrow();
	});

	it("allows state_manager to access resource in their assigned state", () => {
		expect(() =>
			assertResourceScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: "qld", sl: "tax" },
			),
		).not.toThrow();
	});

	it("blocks state_manager from accessing resource in different state", () => {
		expect(() =>
			assertResourceScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: "nsw", sl: "tax" },
			),
		).toThrow(TRPCError);
		try {
			assertResourceScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: "nsw", sl: "tax" },
			);
		} catch (e) {
			expect((e as TRPCError).code).toBe("FORBIDDEN");
		}
	});

	it("allows service_line_lead to access resource in their assigned SL", () => {
		expect(() =>
			assertResourceScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: "acc" },
			),
		).not.toThrow();
	});

	it("blocks service_line_lead from accessing resource in different SL", () => {
		expect(() =>
			assertResourceScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: "tax" },
			),
		).toThrow(TRPCError);
		try {
			assertResourceScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: "tax" },
			);
		} catch (e) {
			expect((e as TRPCError).code).toBe("FORBIDDEN");
		}
	});

	it("allows access when resource has no state/sl (null fields)", () => {
		expect(() =>
			assertResourceScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: null, sl: null },
			),
		).not.toThrow();
	});
});

// ── assertEntityScope ───────────────────────────────────────────────────────

describe("assertEntityScope", () => {
	it("allows admin to access any entity", () => {
		expect(() =>
			assertEntityScope(mockUser({ role: "admin" }), {
				state: "nsw",
				sl: ["tax", "audit"],
			}),
		).not.toThrow();
	});

	it("allows state_manager to access entity in their assigned state", () => {
		expect(() =>
			assertEntityScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: "qld", sl: ["tax"] },
			),
		).not.toThrow();
	});

	it("blocks state_manager from accessing entity in different state", () => {
		expect(() =>
			assertEntityScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: "nsw", sl: ["tax"] },
			),
		).toThrow(TRPCError);
		try {
			assertEntityScope(
				mockUser({ role: "state_manager", assignedState: "qld" }),
				{ state: "nsw", sl: ["tax"] },
			);
		} catch (e) {
			expect((e as TRPCError).code).toBe("FORBIDDEN");
		}
	});

	it("allows service_line_lead to access entity containing their SL", () => {
		expect(() =>
			assertEntityScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: ["acc", "tax"] },
			),
		).not.toThrow();
	});

	it("blocks service_line_lead from accessing entity without their SL", () => {
		expect(() =>
			assertEntityScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: ["tax", "audit"] },
			),
		).toThrow(TRPCError);
		try {
			assertEntityScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: ["tax", "audit"] },
			);
		} catch (e) {
			expect((e as TRPCError).code).toBe("FORBIDDEN");
		}
	});

	it("allows access when entity has empty SL array", () => {
		expect(() =>
			assertEntityScope(
				mockUser({
					role: "service_line_lead",
					assignedServiceLine: "acc",
				}),
				{ state: "qld", sl: [] },
			),
		).not.toThrow();
	});
});
