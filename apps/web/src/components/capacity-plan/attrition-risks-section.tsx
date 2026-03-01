import {
	Alert02Icon,
	Delete02Icon,
	PencilEdit01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import type { EntityDetailData } from "./types";

const RISK_STYLES: Record<string, string> = {
	low: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
	high: "border-red-500/40 bg-red-500/10 text-red-400",
};

export function AttritionRisksSection({
	entityId,
	staff,
}: {
	entityId: string;
	staff: EntityDetailData["staff"];
}) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [flagOpen, setFlagOpen] = useState(false);
	const [editRisk, setEditRisk] = useState<string | null>(null);
	const [formStaff, setFormStaff] = useState("");
	const [formLevel, setFormLevel] = useState<"low" | "medium" | "high">(
		"medium",
	);
	const [formReason, setFormReason] = useState("");
	const [formAction, setFormAction] = useState("");

	const { data: risks } = useQuery(
		trpc.wfpExtended.getAttritionRisks.queryOptions({ entityId }),
	);

	const createRisk = useMutation(
		trpc.wfpExtended.createAttritionRisk.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.firmKPIs.queryKey(),
				});
				setFlagOpen(false);
				resetForm();
				toast.success("Risk flagged");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const updateRisk = useMutation(
		trpc.wfpExtended.updateAttritionRisk.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.firmKPIs.queryKey(),
				});
				setEditRisk(null);
				resetForm();
				toast.success("Risk updated");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteRisk = useMutation(
		trpc.wfpExtended.deleteAttritionRisk.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.firmKPIs.queryKey(),
				});
				toast.success("Risk removed");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function resetForm() {
		setFormStaff("");
		setFormLevel("medium");
		setFormReason("");
		setFormAction("");
	}

	const riskIds = new Set((risks ?? []).map((r) => r.carboniteId));
	const staffMap = new Map(staff.map((s) => [s.id, s]));
	const availableStaff = staff.filter((s) => !riskIds.has(s.id));

	function openEdit(riskId: string) {
		const r = (risks ?? []).find((x) => x.id === riskId);
		if (!r) return;
		setEditRisk(riskId);
		setFormLevel(r.riskLevel as "low" | "medium" | "high");
		setFormReason(r.reason ?? "");
		setFormAction(r.action ?? "");
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					<HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
					Attrition Risks
				</h4>
				{hasWriteAccess && (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-[11px]"
						onClick={() => {
							resetForm();
							setFlagOpen(true);
						}}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
						Flag Risk
					</Button>
				)}
			</div>

			{(risks ?? []).length === 0 ? (
				<p className="text-muted-foreground text-xs">
					No attrition risks flagged
				</p>
			) : (
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
						{(risks ?? []).map((risk) => {
							const member = staffMap.get(risk.carboniteId);
							return (
								<TableRow key={risk.id}>
									<TableCell className="text-sm">
										{member?.name ?? risk.carboniteId}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{member?.role ?? "--"}
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className={`text-[10px] ${RISK_STYLES[risk.riskLevel] ?? ""}`}
										>
											{risk.riskLevel}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs">
										{risk.reason || "--"}
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs">
										{risk.action || "--"}
									</TableCell>
									{hasWriteAccess && (
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => openEdit(risk.id)}
												>
													<HugeiconsIcon
														icon={PencilEdit01Icon}
														className="size-3"
													/>
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
													onClick={() => deleteRisk.mutate({ id: risk.id })}
												>
													<HugeiconsIcon
														icon={Delete02Icon}
														className="size-3"
													/>
												</Button>
											</div>
										</TableCell>
									)}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}

			{/* Flag Risk Dialog */}
			<Dialog open={flagOpen} onOpenChange={(o) => !o && setFlagOpen(false)}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-sm">Flag Attrition Risk</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Staff Member
							</Label>
							<Select
								value={formStaff || "__none__"}
								onValueChange={(v) =>
									setFormStaff(v === "__none__" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Select staff" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__" disabled>
										Select staff
									</SelectItem>
									{availableStaff.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name} ({s.role ?? "N/A"})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Risk Level
							</Label>
							<Select
								value={formLevel}
								onValueChange={(v) => {
									if (v === "low" || v === "medium" || v === "high") {
										setFormLevel(v);
									}
								}}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Reason
							</Label>
							<Textarea
								value={formReason}
								onChange={(e) => setFormReason(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Action
							</Label>
							<Textarea
								value={formAction}
								onChange={(e) => setFormAction(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setFlagOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={!formStaff || createRisk.isPending}
							onClick={() => {
								createRisk.mutate({
									carboniteId: formStaff,
									riskLevel: formLevel,
									reason: formReason || undefined,
									action: formAction || undefined,
								});
							}}
						>
							{createRisk.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Risk Dialog */}
			<Dialog open={!!editRisk} onOpenChange={(o) => !o && setEditRisk(null)}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-sm">Edit Attrition Risk</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Risk Level
							</Label>
							<Select
								value={formLevel}
								onValueChange={(v) => {
									if (v === "low" || v === "medium" || v === "high") {
										setFormLevel(v);
									}
								}}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Reason
							</Label>
							<Textarea
								value={formReason}
								onChange={(e) => setFormReason(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Action
							</Label>
							<Textarea
								value={formAction}
								onChange={(e) => setFormAction(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditRisk(null)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={updateRisk.isPending}
							onClick={() => {
								if (!editRisk) return;
								updateRisk.mutate({
									id: editRisk,
									riskLevel: formLevel,
									reason: formReason || undefined,
									action: formAction || undefined,
								});
							}}
						>
							{updateRisk.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
