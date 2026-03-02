import {
	Location01Icon,
	Mail01Icon,
	SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_LINES, STATE_COLOR_MAP } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────────────────────

export type EntitySummary = {
	id: string;
	biz: string;
	state: string | null;
	officeId: string | null;
	legalName: string | null;
	phone: string | null;
	address: string | null;
	email: string | null;
	headcount: number;
	totalSalary: number;
	sls: string[];
	staffInitials: string[];
	podCount: number;
};

// ── Avatar colour palette ────────────────────────────────────────────────────
// Muted, professional tones that sit quietly on white cards.
// Deterministic: same initials → same colour every render.

const AVATAR_PALETTE = [
	"#6366f1", // indigo
	"#0891b2", // cyan
	"#059669", // emerald
	"#d97706", // amber
	"#dc2626", // red
	"#7c3aed", // violet
	"#2563eb", // blue
	"#c026d3", // fuchsia
] as const;

function hashInitials(initials: string): number {
	let hash = 0;
	for (let i = 0; i < initials.length; i++) {
		hash = (hash << 5) - hash + initials.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function avatarColor(initials: string): string {
	return AVATAR_PALETTE[hashInitials(initials) % AVATAR_PALETTE.length]!;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StateBadge({ stateId }: { stateId: string | null }) {
	if (!stateId) return null;
	const color = STATE_COLOR_MAP[stateId];
	return (
		<Badge
			variant="outline"
			className="h-5 shrink-0 text-[10px] uppercase tracking-wide"
			style={color ? { borderColor: color, color } : undefined}
		>
			{stateId}
		</Badge>
	);
}

function StaffAvatars({
	initials,
	headcount,
}: { initials: string[]; headcount: number }) {
	if (headcount === 0) {
		return (
			<span className="text-muted-foreground text-xs">No staff assigned</span>
		);
	}

	const shown = initials.slice(0, 5);
	const overflow = initials.length - 5;

	return (
		<div className="flex items-center gap-0.5">
			{shown.map((ini, i) => (
				<span
					key={`${ini}-${i.toString()}`}
					className="flex size-7 items-center justify-center rounded-full text-[10px] font-medium text-white"
					style={{ backgroundColor: avatarColor(ini) }}
				>
					{ini}
				</span>
			))}
			{overflow > 0 && (
				<span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
					+{overflow}
				</span>
			)}
		</div>
	);
}

function SlTags({ sls }: { sls: string[] }) {
	if (sls.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-1">
			{sls.map((sl) => {
				const meta = SERVICE_LINES.find((s) => s.id === sl);
				return (
					<span
						key={sl}
						className="rounded-md border border-border bg-muted/50 px-1.5 py-px text-[10px] font-medium text-muted-foreground"
					>
						{meta?.short ?? sl}
					</span>
				);
			})}
		</div>
	);
}

function ContactRow({
	icon,
	children,
}: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
	const Icon = icon;
	return (
		<div className="flex items-start gap-1.5 text-muted-foreground text-xs leading-tight">
			<Icon className="mt-px size-3 shrink-0" />
			<span className="min-w-0 break-words">{children}</span>
		</div>
	);
}

// ── Entity Card ──────────────────────────────────────────────────────────────

export function EntityCard({
	entity,
	fy,
}: { entity: EntitySummary; fy: string }) {
	const hasContact = entity.address || entity.phone || entity.email;

	return (
		<Link
			to="/capacity-plan"
			search={{ entity: entity.id, fy }}
			className="group h-full"
		>
			<Card
				size="sm"
				className="flex h-full flex-col gap-0 py-0 transition-colors group-hover:ring-foreground/25"
			>
				{/* Header */}
				<div className="flex items-start justify-between gap-2 px-4 pt-4 pb-1">
					<div className="min-w-0">
						<h3 className="truncate font-semibold text-sm leading-tight">
							{entity.biz}
						</h3>
						{entity.legalName && (
							<p className="mt-0.5 truncate text-muted-foreground text-xs">
								{entity.legalName}
							</p>
						)}
					</div>
					<StateBadge stateId={entity.state} />
				</div>

				{/* Contact */}
				{hasContact && (
					<div className="space-y-1 px-4 pt-2">
						{entity.address && (
							<ContactRow
								icon={({ className }) => (
									<HugeiconsIcon
										icon={Location01Icon}
										className={className}
									/>
								)}
							>
								{entity.address}
							</ContactRow>
						)}
						{entity.phone && (
							<ContactRow
								icon={({ className }) => (
									<HugeiconsIcon
										icon={SmartPhone01Icon}
										className={className}
									/>
								)}
							>
								{entity.phone}
							</ContactRow>
						)}
						{entity.email && (
							<ContactRow
								icon={({ className }) => (
									<HugeiconsIcon
										icon={Mail01Icon}
										className={className}
									/>
								)}
							>
								<a
									href={`mailto:${entity.email}`}
									className="hover:text-foreground hover:underline"
									onClick={(e) => e.stopPropagation()}
								>
									{entity.email}
								</a>
							</ContactRow>
						)}
					</div>
				)}

				{/* Staff + SL tags */}
				<div className="mt-auto space-y-2.5 px-4 pt-3 pb-4">
					<StaffAvatars
						initials={entity.staffInitials}
						headcount={entity.headcount}
					/>
					<SlTags sls={entity.sls} />

					{/* Footer stats */}
					<div className="flex items-center justify-between border-t border-border pt-2.5">
						<div>
							<span className="font-semibold text-sm tabular-nums">
								{fmtDollar(entity.totalSalary)}
							</span>
							<span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
								payroll/yr
							</span>
						</div>
						<span className="text-muted-foreground text-xs">
							{entity.headcount} staff
							{entity.podCount > 0 && (
								<>
									{" "}
									<span className="text-border">·</span> {entity.podCount}{" "}
									{entity.podCount === 1 ? "pod" : "pods"}
								</>
							)}
						</span>
					</div>
				</div>
			</Card>
		</Link>
	);
}

// ── Grid with loading skeleton ───────────────────────────────────────────────

export function EntityCardGrid({
	data,
	loading,
	fy,
}: {
	data: EntitySummary[] | undefined;
	loading: boolean;
	fy: string;
}) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={`skel-${i.toString()}`} size="sm">
						<div className="space-y-3 p-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-5 w-8 rounded-full" />
							</div>
							<Skeleton className="h-3 w-48" />
							<div className="space-y-1.5">
								<Skeleton className="h-3 w-40" />
								<Skeleton className="h-3 w-28" />
							</div>
							<div className="flex gap-1">
								{Array.from({ length: 4 }).map((_, j) => (
									<Skeleton
										key={`av-${j.toString()}`}
										className="size-7 rounded-full"
									/>
								))}
							</div>
							<div className="flex justify-between border-t pt-2.5">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
					</Card>
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<p className="text-base text-muted-foreground">No entities found.</p>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{data.map((entity) => (
				<EntityCard key={entity.id} entity={entity} fy={fy} />
			))}
		</div>
	);
}
