import { describe, expect, it } from "vitest";

import {
	capColor,
	fmtDate,
	fmtDollar,
	fmtK,
	initials,
	perfPctColor,
} from "../format";

describe("fmtDollar", () => {
	it("returns dash for null", () => {
		expect(fmtDollar(null)).toBe("—");
	});

	it("returns dash for undefined", () => {
		expect(fmtDollar(undefined)).toBe("—");
	});

	it("returns dash for empty string", () => {
		expect(fmtDollar("")).toBe("—");
	});

	it("returns dash for zero", () => {
		expect(fmtDollar(0)).toBe("—");
	});

	it("returns dash for NaN string", () => {
		expect(fmtDollar("abc")).toBe("—");
	});

	it("formats millions", () => {
		expect(fmtDollar(1_500_000)).toBe("$1.5m");
		expect(fmtDollar(2_000_000)).toBe("$2.0m");
	});

	it("formats thousands", () => {
		expect(fmtDollar(75_000)).toBe("$75k");
		expect(fmtDollar(1_000)).toBe("$1k");
		expect(fmtDollar(150_000)).toBe("$150k");
	});

	it("formats small numbers without suffix", () => {
		expect(fmtDollar(500)).toBe("$500");
		expect(fmtDollar(42)).toBe("$42");
	});

	it("handles string inputs", () => {
		expect(fmtDollar("75000")).toBe("$75k");
		expect(fmtDollar("500")).toBe("$500");
	});
});

describe("fmtK", () => {
	it("returns dash for null", () => {
		expect(fmtK(null)).toBe("—");
	});

	it("returns dash for undefined", () => {
		expect(fmtK(undefined)).toBe("—");
	});

	it("formats millions", () => {
		expect(fmtK(1_500_000)).toBe("1.5m");
		expect(fmtK(3_000_000)).toBe("3.0m");
	});

	it("formats thousands", () => {
		expect(fmtK(75_000)).toBe("75k");
		expect(fmtK(1_000)).toBe("1k");
	});

	it("returns plain number for small values", () => {
		expect(fmtK(500)).toBe("500");
		expect(fmtK(0)).toBe("0");
		expect(fmtK(42)).toBe("42");
	});
});

describe("initials", () => {
	it("returns two uppercase initials for a full name", () => {
		expect(initials("John Smith")).toBe("JS");
	});

	it("returns single uppercase initial for a single name", () => {
		expect(initials("Alice")).toBe("A");
	});

	it("takes only the first two initials for three names", () => {
		expect(initials("Mary Jane Watson")).toBe("MJ");
	});

	it("handles lowercase names", () => {
		expect(initials("john smith")).toBe("JS");
	});
});

describe("fmtDate", () => {
	it("returns dash for null", () => {
		expect(fmtDate(null)).toBe("—");
	});

	it("returns dash for undefined", () => {
		expect(fmtDate(undefined)).toBe("—");
	});

	it("formats a Date object", () => {
		const date = new Date("2025-03-15T00:00:00Z");
		const result = fmtDate(date);
		// Should contain the day, abbreviated month, and year
		expect(result).toMatch(/15/);
		expect(result).toMatch(/Mar/);
		expect(result).toMatch(/2025/);
	});

	it("formats a date string", () => {
		const result = fmtDate("2025-06-01T00:00:00Z");
		expect(result).toMatch(/1/);
		expect(result).toMatch(/Jun/);
		expect(result).toMatch(/2025/);
	});
});

describe("capColor", () => {
	it("returns muted for zero budget and zero actual", () => {
		expect(capColor(0, 0)).toBe("text-muted-foreground");
	});

	it("returns red when actual exceeds budget", () => {
		expect(capColor(11, 10)).toBe("text-red-400");
	});

	it("returns amber when at 90% or above capacity (not over)", () => {
		expect(capColor(9, 10)).toBe("text-amber-400");
		expect(capColor(10, 10)).toBe("text-amber-400"); // exactly at budget: pct=1.0 >= 0.9
	});

	it("returns green when well under capacity", () => {
		expect(capColor(5, 10)).toBe("text-green-400");
		expect(capColor(0, 10)).toBe("text-green-400");
	});

	it("returns red when budget is 0 but actual is not", () => {
		expect(capColor(5, 0)).toBe("text-red-400");
	});
});

describe("perfPctColor", () => {
	it("returns muted for null", () => {
		expect(perfPctColor(null)).toBe("text-muted-foreground");
	});

	it("returns green for 100% and above", () => {
		expect(perfPctColor(100)).toBe("text-green-400");
		expect(perfPctColor(150)).toBe("text-green-400");
	});

	it("returns amber for 80-99%", () => {
		expect(perfPctColor(80)).toBe("text-amber-400");
		expect(perfPctColor(99)).toBe("text-amber-400");
	});

	it("returns red below 80%", () => {
		expect(perfPctColor(79)).toBe("text-red-400");
		expect(perfPctColor(0)).toBe("text-red-400");
		expect(perfPctColor(50)).toBe("text-red-400");
	});
});
