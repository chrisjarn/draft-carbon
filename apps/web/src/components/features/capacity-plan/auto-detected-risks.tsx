import { Cancel01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { RISK_STYLES } from "./types";

type AutoDetectedRisk = {
	carboniteId: string;
	name: string;
	riskLevel: string;
	reason: string;
};

export function AutoDetectedRisks({
	risks,
	onAccept,
	onDismiss,
	onDismissAll,
}: {
	risks: AutoDetectedRisk[];
	onAccept: (risk: AutoDetectedRisk) => void;
	onDismiss: (carboniteId: string) => void;
	onDismissAll: () => void;
}) {
	if (risks.length === 0) return null;

	return (
		<div className="mb-3 rounded-md border border-amber-500/30 border-dashed bg-amber-500/5 p-3">
			<div className="mb-2 flex items-center justify-between">
				<p className="font-medium text-sm">
					<Badge
						variant="outline"
						size="sm"
						className="mr-1.5 border-amber-500/40 bg-amber-500/10 text-amber-400"
					>
						auto
					</Badge>
					{risks.length} risk
					{risks.length !== 1 ? "s" : ""} detected
				</p>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 text-text-soft-400 text-xs"
					onClick={onDismissAll}
				>
					Dismiss all
				</Button>
			</div>
			<div className="space-y-2">
				{risks.map((r) => (
					<div
						key={r.carboniteId}
						className="flex items-center justify-between gap-3 rounded border bg-bg-white-0/50 px-3 py-2 text-sm"
					>
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<span className="font-medium">{r.name}</span>
							<Badge
								variant="outline"
								size="sm"
								className={RISK_STYLES[r.riskLevel] ?? ""}
							>
								{r.riskLevel}
							</Badge>
							<span className="truncate text-text-soft-400 text-xs">
								{r.reason}
							</span>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-emerald-400 text-xs hover:text-emerald-300"
								onClick={() => onAccept(r)}
							>
								<HugeiconsIcon icon={Tick01Icon} className="mr-0.5 size-3" />
								Accept
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-text-soft-400 text-xs"
								onClick={() => onDismiss(r.carboniteId)}
							>
								<HugeiconsIcon icon={Cancel01Icon} className="mr-0.5 size-3" />
								Dismiss
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
