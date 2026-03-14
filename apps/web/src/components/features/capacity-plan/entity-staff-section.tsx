import { ArrowDown01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { PersonNameCell } from "@/components/molecules/person-name-cell";
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

const DEFAULT_MULTIPLIER = 3.5;

export function EntityStaffSection({
	staff,
	billingMultiplier,
	inline = false,
}: {
	staff: EntityDetailData["staff"];
	billingMultiplier: string | null;
	inline?: boolean;
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
		if (pctVal === null) return "text-text-soft-400";
		if (pctVal >= 100) return "text-emerald-400";
		if (pctVal >= 80) return "text-amber-400";
		return "text-red-400";
	}

	const tableContent =
		staff.length === 0 ? (
			<p className="py-8 text-center text-sm text-text-soft-400">
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
						const attainment = getAttainmentPct(s.meta?.billingActual, target);

						return (
							<TableRow key={s.id}>
								<TableCell>
									<PersonNameCell name={s.name} />
								</TableCell>
								<TableCell className="text-sm text-text-soft-400">
									{s.role ?? "\u2014"}
								</TableCell>
								<TableCell className="text-right text-sm">
									{target > 0 ? (
										<span
											className={cn(
												"tabular-nums",
												hasOverride ? "font-semibold" : "text-text-soft-400",
											)}
										>
											{fmtDollar(target)}
											{!hasOverride && (
												<span className="ml-1 text-text-soft-400/70 text-xs">
													Auto
												</span>
											)}
										</span>
									) : (
										<span className="text-text-soft-400">{"\u2014"}</span>
									)}
								</TableCell>
								<TableCell className="text-right text-sm tabular-nums">
									{fmtDollar(s.meta?.billingActual)}
								</TableCell>
								<TableCell className="text-right text-sm">
									<span
										className={cn("tabular-nums", attainmentColor(attainment))}
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
		);

	if (inline) {
		return tableContent;
	}

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-sm border border-stroke-soft-200 bg-bg-weak-50/40 px-3 py-2 transition-colors hover:bg-bg-weak-50">
				<h4 className="flex items-center gap-1.5 font-medium text-sm">
					<HugeiconsIcon
						icon={UserGroupIcon}
						className="size-3.5 text-text-soft-400"
					/>
					Staff Billing
					<Badge variant="outline" size="sm" className="ml-1">
						{staff.length}
					</Badge>
				</h4>
				<HugeiconsIcon
					icon={ArrowDown01Icon}
					className={cn(
						"size-3.5 text-text-soft-400 transition-transform duration-200",
						open && "rotate-180",
					)}
				/>
			</CollapsibleTrigger>

			<CollapsiblePanel>{tableContent}</CollapsiblePanel>
		</Collapsible>
	);
}
