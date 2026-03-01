import { PencilEdit01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fmtDollar } from "@/lib/format";

import type { StaffWithMeta } from "./types";

// ── Perf rating badge ─────────────────────────────────────────────────────────

const PERF_STYLES: Record<string, string> = {
	Exceeds: "border-green-500/40 bg-green-500/10 text-green-400",
	Meets: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	Below: "border-red-500/40 bg-red-500/10 text-red-400",
	"N/A": "border-border bg-muted/40 text-muted-foreground",
};

export function PerfBadge({ rating }: { rating: string | null | undefined }) {
	const r = rating ?? "N/A";
	const cls = PERF_STYLES[r] ?? PERF_STYLES["N/A"];
	return (
		<Badge variant="outline" className={`text-[10px] ${cls}`}>
			{r}
		</Badge>
	);
}

// ── Percentage helper ─────────────────────────────────────────────────────────

export function pct(actual: string | null, target: string | null): string {
	const a = Number(actual);
	const t = Number(target);
	if (!t || !a) return "\u2014";
	return `${Math.round((a / t) * 100)}%`;
}

// ── Inline editable cell ──────────────────────────────────────────────────────

export function EditableCell({
	value,
	onSave,
	prefix = "$",
	disabled,
}: {
	value: string | null | undefined;
	onSave: (v: string) => void;
	prefix?: string;
	disabled?: boolean;
}) {
	const [editing, setEditing] = useState(false);
	const [val, setVal] = useState(value ?? "");

	if (disabled) return <span className="text-xs">{fmtDollar(value)}</span>;

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<span className="text-muted-foreground text-xs">{prefix}</span>
				<Input
					type="number"
					value={val}
					onChange={(e) => setVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onSave(val);
							setEditing(false);
						}
						if (e.key === "Escape") setEditing(false);
					}}
					className="h-6 w-20 text-xs"
					autoFocus
				/>
				<button
					type="button"
					onClick={() => {
						onSave(val);
						setEditing(false);
					}}
					className="text-green-400 hover:text-green-300"
				>
					<HugeiconsIcon icon={Tick01Icon} className="size-3.5" />
				</button>
			</div>
		);
	}

	return (
		<div className="group flex items-center gap-1">
			<span className="text-xs">{fmtDollar(value)}</span>
			<button
				type="button"
				onClick={() => {
					setVal(value ?? "");
					setEditing(true);
				}}
				className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
			>
				<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
			</button>
		</div>
	);
}

// ── Unique filter helper ──────────────────────────────────────────────────────

export function unique(
	items: StaffWithMeta[],
	key: keyof StaffWithMeta,
): string[] {
	return [
		...new Set(
			items.map((i) => i[key] as string | null).filter((v): v is string => !!v),
		),
	].sort();
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

export function KpiCard({
	label,
	value,
	icon,
	loading,
	muted,
}: {
	label: string;
	value: string;
	icon: React.ReactNode;
	loading: boolean;
	muted?: boolean;
}) {
	return (
		<Card size="sm">
			<CardHeader className="flex-row items-center justify-between pb-1">
				<CardTitle className="font-normal text-muted-foreground text-xs">
					{label}
				</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				{loading ? (
					<span className="text-muted-foreground text-xs">Loading...</span>
				) : (
					<span
						className={`font-bold text-xl tabular-nums ${muted ? "text-muted-foreground" : ""}`}
					>
						{value}
					</span>
				)}
			</CardContent>
		</Card>
	);
}
