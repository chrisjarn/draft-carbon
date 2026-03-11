import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { fmtDollar } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PerfBadge, pct } from "./shared";
import type { EntityDetailData } from "./types";

// ── Default multiplier if none configured ─────────────────────────────────────

const DEFAULT_MULTIPLIER = 3.5;

// ── EntityStaffSection ────────────────────────────────────────────────────────

export function EntityStaffSection({
	staff,
	billingMultiplier,
}: {
	staff: EntityDetailData["staff"];
	billingMultiplier: string | null;
}) {
	const [open, setOpen] = useState(false);
	const multiplier = Number(billingMultiplier) || DEFAULT_MULTIPLIER;

	function computeAutoTarget(salary: number | null): number {
		if (!salary) return 0;
		return salary * multiplier;
	}

	function getAttainmentPct(
		actual: string | null | undefined,
		target: number,
	): number | null {
		const a = Number(actual);
		if (!a || !target) return null;
		return Math.round((a / target) * 100);
	}

	function attainmentColor(pctVal: number | null): string {
		if (pctVal === null) return "text-muted-foreground";
		if (pctVal >= 100) return "text-green-400";
		if (pctVal >= 80) return "text-amber-400";
		return "text-red-400";
	}

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-sm px-1 py-1.5 hover:bg-muted/30">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
					<HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />
					Staff Billing
					<Badge variant="outline" size="sm" className="ml-1">
						{staff.length}
					</Badge>
				</h4>
				<HugeiconsIcon
					icon={open ? ArrowUp01Icon : ArrowDown01Icon}
					className="size-3.5 text-muted-foreground"
				/>
			</CollapsibleTrigger>

			<CollapsiblePanel>
				{staff.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No staff in this entity
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Role</TableHead>
								<TableHead className="text-right">Billing Target</TableHead>
								<TableHead className="text-right">Actual</TableHead>
								<TableHead className="text-right">Attainment</TableHead>
								<TableHead className="text-center">Perf</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{staff.map((s) => {
								const hasOverride = !!s.meta?.billingTarget;
								const target = hasOverride
									? Number(s.meta?.billingTarget)
									: computeAutoTarget(s.salary);
								const attainment = getAttainmentPct(
									s.meta?.billingActual,
									target,
								);

								return (
									<TableRow key={s.id}>
										<TableCell className="text-sm">{s.name}</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{s.role ?? "\u2014"}
										</TableCell>
										<TableCell className="text-right text-sm">
											{target > 0 ? (
												<span
													className={cn(
														"tabular-nums",
														hasOverride
															? "font-semibold"
															: "text-muted-foreground",
													)}
												>
													{fmtDollar(target)}
													{!hasOverride && (
														<span className="ml-1 text-muted-foreground/70 text-xs">
															Auto
														</span>
													)}
												</span>
											) : (
												<span className="text-muted-foreground">
													{"\u2014"}
												</span>
											)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{fmtDollar(s.meta?.billingActual)}
										</TableCell>
										<TableCell className="text-right text-sm">
											<span
												className={cn(
													"tabular-nums",
													attainmentColor(attainment),
												)}
											>
												{pct(
													s.meta?.billingActual ?? null,
													target > 0 ? String(target) : null,
												)}
											</span>
										</TableCell>
										<TableCell className="text-center">
											<PerfBadge rating={s.meta?.perfRating} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</CollapsiblePanel>
		</Collapsible>
	);
}
