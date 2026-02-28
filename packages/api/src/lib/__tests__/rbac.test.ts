import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
	ADMIN_WRITE_ROLES,
	assertAdmin,
	assertWriter,
	getUserRole,
} from "../rbac";

describe("getUserRole", () => {
	it("returns 'readonly' for null user", () => {
		expect(getUserRole(null)).toBe("readonly");
	});

	it("returns 'readonly' for undefined user", () => {
		expect(getUserRole(undefined)).toBe("readonly");
	});

	it("returns 'readonly' when user has no role property", () => {
		expect(getUserRole({ name: "Alice" })).toBe("readonly");
	});

	it("returns 'readonly' when role is not a string", () => {
		expect(getUserRole({ role: 42 })).toBe("readonly");
	});

	it("returns the role string for a valid user", () => {
		expect(getUserRole({ role: "admin" })).toBe("admin");
		expect(getUserRole({ role: "practice_manager" })).toBe("practice_manager");
		expect(getUserRole({ role: "sl_lead" })).toBe("sl_lead");
		expect(getUserRole({ role: "state_manager" })).toBe("state_manager");
		expect(getUserRole({ role: "readonly" })).toBe("readonly");
	});
});

describe("assertWriter", () => {
	it("throws FORBIDDEN for readonly role", () => {
		expect(() => assertWriter({ role: "readonly" })).toThrow(TRPCError);
		try {
			assertWriter({ role: "readonly" });
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

	it("does not throw for sl_lead", () => {
		expect(() => assertWriter({ role: "sl_lead" })).not.toThrow();
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
		expect(() => assertWriter({ role: "sl_lead" }, ADMIN_WRITE_ROLES)).toThrow(
			TRPCError,
		);
		expect(() =>
			assertWriter({ role: "state_manager" }, ADMIN_WRITE_ROLES),
		).toThrow(TRPCError);
	});
});

describe("assertAdmin", () => {
	it("throws FORBIDDEN for non-admin roles", () => {
		for (const role of [
			"readonly",
			"practice_manager",
			"sl_lead",
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
