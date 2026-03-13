import { fmtDollar } from "@/lib/format";
import { cn } from "@/lib/utils";

type BaselineStripProps = {
	totalPayroll: number;
	billingCapacity: number;
	multiple: number;
	revenueGap: number;
	className?: string;
};

/**
 * Horizontal baseline metrics strip for the Scenarios page.
 * Shows current-state KPIs for the selected entity so the user
 * has context when comparing scenarios.
 */
export function ScenarioBaselineStrip({
	totalPayroll,
	billingCapacity,
	multiple,
	revenueGap,
	className,
}: BaselineStripProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-6 rounded-md border  bg-bg-weak-50/20 px-4 py-2.5",
				className,
			)}
		>
			<BaselineStat label="Payroll" value={fmtDollar(totalPayroll)} />
			<Separator />
			<BaselineStat label="Billing Cap" value={fmtDollar(billingCapacity)} />
			<Separator />
			<BaselineStat label="Multiple" value={`${multiple.toFixed(2)}\u00D7`} />
			<Separator />
			<BaselineStat
				label="Rev Gap"
				value={fmtDollar(Math.abs(revenueGap))}
				valueClass={
					revenueGap > 0
						? "text-red-400"
						: revenueGap < 0
							? "text-emerald-400"
							: undefined
				}
				suffix={
					revenueGap > 0
						? " shortfall"
						: revenueGap < 0
							? " surplus"
							: undefined
				}
			/>
		</div>
	);
}

function BaselineStat({
	label,
	value,
	valueClass,
	suffix,
}: {
	label: string;
	value: string;
	valueClass?: string;
	suffix?: string;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-text-soft-400 text-xs">{label}</span>
			<span
				className={cn(
					"font-semibold text-sm tabular-nums leading-tight",
					valueClass,
				)}
			>
				{value}
				{suffix && (
					<span className="font-normal text-text-soft-400 text-xs">
						{suffix}
					</span>
				)}
			</span>
		</div>
	);
}

function Separator() {
	return <div className="h-6 w-px bg-border" />;
}
