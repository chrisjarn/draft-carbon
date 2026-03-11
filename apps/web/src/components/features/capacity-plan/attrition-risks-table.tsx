import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { RISK_STYLES } from "./types";

type RiskRow = {
	id: string;
	carboniteId: string;
	riskLevel: string;
	reason: string | null;
	action: string | null;
};

type StaffMember = {
	name: string;
	role: string | null;
};

export function AttritionRisksTable({
	risks,
	staffMap,
	hasWriteAccess,
	onEdit,
	onDelete,
}: {
	risks: RiskRow[];
	staffMap: Map<string, StaffMember>;
	hasWriteAccess: boolean;
	onEdit: (riskId: string) => void;
	onDelete: (riskId: string) => void;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Risk</TableHead>
					<TableHead>Reason</TableHead>
					<TableHead>Action</TableHead>
					{hasWriteAccess && <TableHead className="w-16" />}
				</TableRow>
			</TableHeader>
			<TableBody>
				{risks.map((risk) => {
					const member = staffMap.get(risk.carboniteId);
					return (
						<TableRow key={risk.id}>
							<TableCell className="text-base">
								{member?.name ?? risk.carboniteId}
							</TableCell>
							<TableCell className="text-muted-foreground text-sm">
								{member?.role ?? "--"}
							</TableCell>
							<TableCell>
								<Badge
									variant="outline"
									size="sm"
									className={RISK_STYLES[risk.riskLevel] ?? ""}
								>
									{risk.riskLevel}
								</Badge>
							</TableCell>
							<TableCell className="max-w-[200px] truncate text-sm">
								{risk.reason || "--"}
							</TableCell>
							<TableCell className="max-w-[200px] truncate text-sm">
								{risk.action || "--"}
							</TableCell>
							{hasWriteAccess && (
								<TableCell>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => onEdit(risk.id)}
										>
											<HugeiconsIcon
												icon={PencilEdit01Icon}
												className="size-3"
											/>
										</Button>
										<Button
											variant="ghost"
											size="icon-xs"
											className="text-red-400 hover:text-red-300"
											onClick={() => onDelete(risk.id)}
										>
											<HugeiconsIcon icon={Delete02Icon} className="size-3" />
										</Button>
									</div>
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
