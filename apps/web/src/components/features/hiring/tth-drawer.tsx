import { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIME_TO_HIRE, TTH_SUMMARY } from "@/lib/constants";
import { fmtCurrency } from "@/lib/format";

// ── Salary bracket data ───────────────────────────────────────────────────────

type SalaryBracket = {
	role: string;
	level: number;
	min: number;
	mid: number;
	max: number;
};

const SALARY_DATA: Record<string, SalaryBracket[]> = {
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

export const TTH_DRAWER_TABS = [
	{ id: "acc", label: "Accounting & Tax" },
	{ id: "bkcfo", label: "Bookkeeping & CFO" },
] as const;

function fmt$(n: number) {
	return fmtCurrency(n, { maxFractionDigits: 0 });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TthDrawer({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [activeSl, setActiveSl] = useState<string>("acc");
	const tthRows = TIME_TO_HIRE[activeSl] ?? [];
	const salaryRows = SALARY_DATA[activeSl] ?? [];

	return (
		<Sheet open={open} onOpenChange={(o) => !o && onClose()}>
			<SheetContent size="xl">
				<SheetHeader>
					<SheetTitle>Time to Hire &amp; Salary Brackets</SheetTitle>
					<p className="text-muted-foreground text-sm">
						Reference data for planning &mdash; hire timelines and salary ranges
						by role.
					</p>
					{/* Summary strip */}
					<div className="flex gap-6 rounded-md border bg-muted/30 px-4 py-3 text-sm">
						<div>
							<p className="text-muted-foreground text-xs">Avg Time to Hire</p>
							<p className="font-semibold tabular-nums">
								{TTH_SUMMARY.avgHireWeeks} weeks
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Avg Notice Period</p>
							<p className="font-semibold tabular-nums">
								{TTH_SUMMARY.avgNoticeWeeks} weeks
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Total Lead Time</p>
							<p className="font-semibold tabular-nums">
								{TTH_SUMMARY.avgHireWeeks + TTH_SUMMARY.avgNoticeWeeks} weeks
							</p>
						</div>
					</div>
					{/* SL tabs */}
					<Tabs value={activeSl} onValueChange={setActiveSl}>
						<TabsList>
							{TTH_DRAWER_TABS.map((t) => (
								<TabsTrigger key={t.id} value={t.id}>
									{t.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</SheetHeader>

				<SheetPanel>
					{/* Time to Hire table */}
					<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Time to Hire
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Role</TableHead>
								<TableHead className="text-right">Hire Time</TableHead>
								<TableHead className="text-right">Notice Period</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tthRows.map((entry) => (
								<TableRow key={entry.role}>
									<TableCell className="text-sm">{entry.role}</TableCell>
									<TableCell className="text-right text-muted-foreground text-sm tabular-nums">
										{entry.hireWeeks[0]}&ndash;{entry.hireWeeks[1]} wks
									</TableCell>
									<TableCell className="text-right text-muted-foreground text-sm tabular-nums">
										{entry.noticeWeeks[0]}&ndash;{entry.noticeWeeks[1]} wks
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{/* Salary brackets table */}
					<p className="mt-6 mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Salary Brackets
					</p>
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
							{salaryRows.map((b) => (
								<TableRow key={b.role}>
									<TableCell className="text-sm">{b.role}</TableCell>
									<TableCell className="text-center text-muted-foreground text-sm tabular-nums">
										{b.level}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{fmt$(b.min)}
									</TableCell>
									<TableCell className="text-right font-medium text-sm tabular-nums">
										{fmt$(b.mid)}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{fmt$(b.max)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</SheetPanel>
			</SheetContent>
		</Sheet>
	);
}
