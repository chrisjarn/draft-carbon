export function fmtDollar(v: string | number | null | undefined): string {
	const n = typeof v === "number" ? v : Number(v);
	if (v == null || v === "" || Number.isNaN(n) || n === 0) return "—";
	if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
	if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
	return `$${n}`;
}

export function fmtK(v: number | null | undefined): string {
	if (v == null) return "—";
	if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
	if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
	return String(v);
}

export function initials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function fmtDate(d: Date | string | null | undefined): string {
	if (!d) return "—";
	const date = typeof d === "string" ? new Date(d) : d;
	return date.toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function capColor(
	actual: number,
	budget: number,
):
	| "text-green-400"
	| "text-amber-400"
	| "text-red-400"
	| "text-muted-foreground" {
	if (budget === 0 && actual === 0) return "text-muted-foreground";
	if (actual > budget) return "text-red-400";
	const pct = budget > 0 ? actual / budget : 0;
	if (pct >= 0.9) return "text-amber-400";
	return "text-green-400";
}

export function perfPctColor(
	pct: number | null,
):
	| "text-green-400"
	| "text-amber-400"
	| "text-red-400"
	| "text-muted-foreground" {
	if (pct === null) return "text-muted-foreground";
	if (pct >= 100) return "text-green-400";
	if (pct >= 80) return "text-amber-400";
	return "text-red-400";
}
