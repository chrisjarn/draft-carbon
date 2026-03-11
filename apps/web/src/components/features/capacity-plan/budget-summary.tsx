import { Card, CardContent } from "@/components/ui/card";
import { fmtDollar } from "@/lib/format";

export function BudgetSummary({
	totalBudget,
	totalActual,
}: {
	totalBudget: number;
	totalActual: number;
}) {
	const variance = totalBudget - totalActual;
	const utilisation =
		totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

	return (
		<div className="grid grid-cols-4 gap-3 pb-4">
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Total Budget</p>
					<p className="font-bold text-lg tabular-nums">
						{totalBudget > 0 ? fmtDollar(totalBudget) : "—"}
					</p>
				</CardContent>
			</Card>
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Total Staff Cost</p>
					<p className="font-bold text-lg tabular-nums">
						{fmtDollar(totalActual)}
					</p>
				</CardContent>
			</Card>
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Variance</p>
					<p
						className={`font-bold text-lg tabular-nums ${
							variance < 0
								? "text-red-400"
								: variance > 0
									? "text-green-400"
									: "text-muted-foreground"
						}`}
					>
						{totalBudget > 0
							? variance > 0
								? `+${fmtDollar(variance)}`
								: variance === 0
									? "—"
									: fmtDollar(variance)
							: "—"}
					</p>
				</CardContent>
			</Card>
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Utilisation</p>
					<p
						className={`font-bold text-lg tabular-nums ${
							utilisation > 100
								? "text-red-400"
								: utilisation >= 90
									? "text-amber-400"
									: "text-green-400"
						}`}
					>
						{totalBudget > 0 ? `${utilisation}%` : "—"}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
