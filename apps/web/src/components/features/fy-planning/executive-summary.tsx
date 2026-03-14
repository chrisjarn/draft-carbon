import { fmtDollar } from "@/lib/format";

// -- Types --------------------------------------------------------------------

export type FYSummaryData = {
	fyLabel: string;
	revenueActual: number;
	revenueTarget: number;
	attainmentPct: number | null;
	entityCount: number;
	stateCount: number;
	totalPayroll: number;
	payrollPct: number | null;
	openPositions: number;
	atRiskCount: number;
};

// -- Component ----------------------------------------------------------------

export function ExecutiveSummary({ data }: { data: FYSummaryData }) {
	const {
		fyLabel,
		revenueActual,
		revenueTarget,
		attainmentPct,
		entityCount,
		stateCount,
		totalPayroll,
		payrollPct,
		openPositions,
		atRiskCount,
	} = data;

	const attainmentClass =
		attainmentPct === null
			? "text-text-soft-400"
			: attainmentPct >= 90
				? "text-green-600"
				: attainmentPct >= 75
					? "text-yellow-600"
					: "text-red-600";

	const payrollClass =
		payrollPct !== null && payrollPct > 35
			? "text-amber-600"
			: "text-text-strong-950";

	return (
		<blockquote className="rounded-r-lg border-blue-600 border-l-4 bg-blue-50/50 p-5">
			<p className="text-balance text-sm text-text-strong-950 leading-relaxed">
				In <strong className="tabular-nums">{fyLabel}</strong>, Carbon tracked{" "}
				<strong className="tabular-nums">{fmtDollar(revenueActual)}</strong>{" "}
				actual revenue against a{" "}
				<strong className="tabular-nums">{fmtDollar(revenueTarget)}</strong>{" "}
				target across <strong className="tabular-nums">{entityCount}</strong>{" "}
				{entityCount === 1 ? "entity" : "entities"} in{" "}
				<strong className="tabular-nums">{stateCount}</strong>{" "}
				{stateCount === 1 ? "state" : "states"}, delivering{" "}
				<strong className={`tabular-nums ${attainmentClass}`}>
					{attainmentPct !== null ? `${attainmentPct}%` : "\u2014"} attainment
				</strong>
				.{" "}
				{totalPayroll > 0 && (
					<>
						Total payroll of{" "}
						<strong className="tabular-nums">{fmtDollar(totalPayroll)}</strong>
						{payrollPct !== null && (
							<>
								{" "}
								represents{" "}
								<strong className={`tabular-nums ${payrollClass}`}>
									{payrollPct}%
								</strong>{" "}
								of revenue
							</>
						)}
						.{" "}
					</>
				)}
				{openPositions > 0 && (
					<>
						There {openPositions === 1 ? "is" : "are"}{" "}
						<strong className="tabular-nums">{openPositions}</strong> open{" "}
						{openPositions === 1 ? "position" : "positions"} in the hiring
						pipeline.{" "}
					</>
				)}
				{atRiskCount > 0 && (
					<>
						<strong className="text-amber-600 tabular-nums">
							{atRiskCount}
						</strong>{" "}
						{atRiskCount === 1 ? "staff member has" : "staff members have"} been
						flagged as attrition risks.
					</>
				)}
			</p>
		</blockquote>
	);
}
