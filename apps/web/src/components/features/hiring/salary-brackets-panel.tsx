import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─── Static salary bracket data ───────────────────────────────────────── */

type SalaryBracket = {
	role: string;
	level: number;
	min: number;
	mid: number;
	max: number;
};

const SALARY_BRACKETS: Record<string, SalaryBracket[]> = {
	acc: [
		{
			role: "Undergraduate Accountant",
			level: 1,
			min: 55000,
			mid: 62000,
			max: 70000,
		},
		{
			role: "Graduate Accountant",
			level: 2,
			min: 60000,
			mid: 68000,
			max: 78000,
		},
		{ role: "Accountant", level: 3, min: 70000, mid: 80000, max: 95000 },
		{
			role: "Senior Accountant",
			level: 4,
			min: 85000,
			mid: 100000,
			max: 120000,
		},
		{ role: "Client Manager", level: 5, min: 100000, mid: 120000, max: 145000 },
		{ role: "Senior Manager", level: 7, min: 130000, mid: 155000, max: 180000 },
		{
			role: "Associate Director",
			level: 8,
			min: 160000,
			mid: 190000,
			max: 220000,
		},
	],
	bkcfo: [
		{ role: "Junior Bookkeeper", level: 1, min: 48000, mid: 55000, max: 62000 },
		{ role: "Bookkeeper", level: 2, min: 55000, mid: 62000, max: 72000 },
		{ role: "Senior Bookkeeper", level: 3, min: 65000, mid: 75000, max: 88000 },
		{
			role: "Client Manager (BKK)",
			level: 4,
			min: 78000,
			mid: 90000,
			max: 105000,
		},
		{
			role: "Senior Manager (BKK)",
			level: 6,
			min: 110000,
			mid: 130000,
			max: 155000,
		},
		{ role: "Director (BKK)", level: 7, min: 140000, mid: 165000, max: 195000 },
	],
};

const TAB_OPTIONS = [
	{ id: "acc", label: "Accounting & Tax" },
	{ id: "bkcfo", label: "Bookkeeping & CFO" },
] as const;

/* ─── Formatting helper ────────────────────────────────────────────────── */

function fmtSalary(n: number): string {
	return fmtCurrency(n, { maxFractionDigits: 0 });
}

/* ─── Component ────────────────────────────────────────────────────────── */

export function SalaryBracketsPanel() {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("acc");

	const brackets = SALARY_BRACKETS[activeTab] ?? [];

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-sm px-1 py-1.5 hover:bg-bg-weak-50/30">
				<h4 className="flex items-center gap-1.5 font-medium text-sm text-text-soft-400">
					Salary Brackets Reference
				</h4>
				<HugeiconsIcon
					icon={open ? ArrowUp01Icon : ArrowDown01Icon}
					className="size-3.5 text-text-soft-400"
				/>
			</CollapsibleTrigger>

			<CollapsiblePanel>
				<div className="pt-3 pb-1">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList>
							{TAB_OPTIONS.map((tab) => (
								<TabsTrigger key={tab.id} value={tab.id}>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Role</TableHead>
							<TableHead className="text-center">Level</TableHead>
							<TableHead className="text-right">Min</TableHead>
							<TableHead className="text-right">Mid</TableHead>
							<TableHead className="text-right">Max</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{brackets.map((bracket) => (
							<TableRow key={`${activeTab}-${bracket.role}`}>
								<TableCell className="text-sm">{bracket.role}</TableCell>
								<TableCell className="text-center text-sm text-text-soft-400 tabular-nums">
									{bracket.level}
								</TableCell>
								<TableCell className="text-right text-sm tabular-nums">
									{fmtSalary(bracket.min)}
								</TableCell>
								<TableCell
									className={cn("text-right font-medium text-sm tabular-nums")}
								>
									{fmtSalary(bracket.mid)}
								</TableCell>
								<TableCell className="text-right text-sm tabular-nums">
									{fmtSalary(bracket.max)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CollapsiblePanel>
		</Collapsible>
	);
}
