import {
	Delete02Icon,
	MagicWand01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { authClient } from "@/lib/auth-client";
import { SERVICE_LINES } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

type ScenarioRoleForm = {
	roleTitle: string;
	sl: string;
	salary: string;
	count: string;
};

const PRESET_COLORS = [
	"#4CAF50",
	"#2196F3",
	"#FF8C00",
	"#7B2FBE",
	"#F76707",
	"#F5C518",
	"#e84040",
	"#12B886",
];

export function ScenarioWorkbenchSection({ entityId }: { entityId: string }) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formName, setFormName] = useState("");
	const [formDesc, setFormDesc] = useState("");
	const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
	const [formRoles, setFormRoles] = useState<ScenarioRoleForm[]>([
		{ roleTitle: "", sl: "", salary: "", count: "1" },
	]);

	const { data: scenarioList } = useQuery(
		trpc.wfpExtended.getScenarios.queryOptions({ entityId }),
	);

	const createScenario = useMutation(
		trpc.wfpExtended.createScenario.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				setDialogOpen(false);
				resetScenarioForm();
				toast.success("Scenario created");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteScenario = useMutation(
		trpc.wfpExtended.deleteScenario.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				toast.success("Scenario deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function resetScenarioForm() {
		setFormName("");
		setFormDesc("");
		setFormColor(PRESET_COLORS[0]);
		setFormRoles([{ roleTitle: "", sl: "", salary: "", count: "1" }]);
	}

	function updateRole(idx: number, key: keyof ScenarioRoleForm, val: string) {
		setFormRoles((prev) =>
			prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
		);
	}

	function removeRole(idx: number) {
		setFormRoles((prev) => prev.filter((_, i) => i !== idx));
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					<HugeiconsIcon icon={MagicWand01Icon} className="size-3.5" />
					Scenario Workbench
				</h4>
				{hasWriteAccess && (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-[11px]"
						onClick={() => {
							resetScenarioForm();
							setDialogOpen(true);
						}}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
						New Scenario
					</Button>
				)}
			</div>

			{(scenarioList ?? []).length === 0 ? (
				<p className="text-muted-foreground text-xs">No scenarios created</p>
			) : (
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					{(scenarioList ?? []).map((sc) => {
						const totalPayroll = sc.roles.reduce(
							(sum, r) => sum + r.salary * r.count,
							0,
						);
						const totalHeadcount = sc.roles.reduce(
							(sum, r) => sum + r.count,
							0,
						);
						return (
							<Card key={sc.id} className="relative overflow-hidden">
								<div
									className="absolute top-0 left-0 h-full w-1"
									style={{ backgroundColor: sc.color ?? "#666" }}
								/>
								<CardHeader className="pb-2 pl-4">
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm">{sc.name}</CardTitle>
										{hasWriteAccess && (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
												onClick={() => deleteScenario.mutate({ id: sc.id })}
											>
												<HugeiconsIcon icon={Delete02Icon} className="size-3" />
											</Button>
										)}
									</div>
									{sc.description && (
										<p className="text-[11px] text-muted-foreground">
											{sc.description}
										</p>
									)}
								</CardHeader>
								<CardContent className="pl-4">
									{sc.roles.length > 0 && (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Role</TableHead>
													<TableHead>SL</TableHead>
													<TableHead className="text-right">Salary</TableHead>
													<TableHead className="text-right">Count</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{sc.roles.map((role) => (
													<TableRow key={role.id}>
														<TableCell className="text-xs">
															{role.roleTitle}
														</TableCell>
														<TableCell className="text-muted-foreground text-xs">
															{role.sl || "--"}
														</TableCell>
														<TableCell className="text-right text-xs tabular-nums">
															{fmtDollar(role.salary)}
														</TableCell>
														<TableCell className="text-right text-xs tabular-nums">
															{role.count}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									)}
									<div className="mt-2 flex items-center gap-4 text-[11px]">
										<span className="text-muted-foreground">
											New Payroll:{" "}
											<span className="font-medium text-foreground tabular-nums">
												{fmtDollar(totalPayroll)}
											</span>
										</span>
										<span className="text-muted-foreground">
											Headcount:{" "}
											<span className="font-medium text-foreground tabular-nums">
												+{totalHeadcount}
											</span>
										</span>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* New Scenario Dialog */}
			<Dialog
				open={dialogOpen}
				onOpenChange={(o) => !o && setDialogOpen(false)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-sm">New Scenario</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Name
							</Label>
							<Input
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								className="h-8 text-xs"
								placeholder="e.g. Q3 Growth Plan"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Description
							</Label>
							<Input
								value={formDesc}
								onChange={(e) => setFormDesc(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Color
							</Label>
							<div className="flex items-center gap-1.5">
								{PRESET_COLORS.map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => setFormColor(c)}
										className={`size-5 rounded-full border-2 transition-colors ${
											formColor === c
												? "border-foreground"
												: "border-transparent"
										}`}
										style={{ backgroundColor: c }}
									/>
								))}
							</div>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Roles
							</Label>
							<div className="space-y-2">
								{formRoles.map((role, idx) => (
									<div
										key={`role-row-${idx}`}
										className="flex items-center gap-1.5"
									>
										<Input
											value={role.roleTitle}
											onChange={(e) =>
												updateRole(idx, "roleTitle", e.target.value)
											}
											className="h-7 flex-1 text-[11px]"
											placeholder="Role title"
										/>
										<Select
											value={role.sl || "__none__"}
											onValueChange={(v) =>
												updateRole(idx, "sl", v === "__none__" ? "" : (v ?? ""))
											}
										>
											<SelectTrigger className="h-7 w-24 text-[11px]">
												<SelectValue placeholder="SL" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">None</SelectItem>
												{SERVICE_LINES.map((sl) => (
													<SelectItem key={sl.id} value={sl.id}>
														{sl.short}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											type="number"
											value={role.salary}
											onChange={(e) =>
												updateRole(idx, "salary", e.target.value)
											}
											className="h-7 w-20 text-[11px]"
											placeholder="Salary"
										/>
										<Input
											type="number"
											value={role.count}
											onChange={(e) => updateRole(idx, "count", e.target.value)}
											className="h-7 w-12 text-[11px]"
											placeholder="#"
											min={1}
										/>
										{formRoles.length > 1 && (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
												onClick={() => removeRole(idx)}
											>
												<HugeiconsIcon icon={Delete02Icon} className="size-3" />
											</Button>
										)}
									</div>
								))}
								<Button
									variant="outline"
									size="sm"
									className="h-6 text-[11px]"
									onClick={() =>
										setFormRoles((prev) => [
											...prev,
											{ roleTitle: "", sl: "", salary: "", count: "1" },
										])
									}
								>
									<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
									Add Role
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={!formName || createScenario.isPending}
							onClick={() => {
								const validRoles = formRoles
									.filter((r) => r.roleTitle && r.salary)
									.map((r) => ({
										roleTitle: r.roleTitle,
										sl: r.sl || undefined,
										salary: Number(r.salary),
										count: Number(r.count) || 1,
									}));
								createScenario.mutate({
									entityId,
									name: formName,
									description: formDesc || undefined,
									color: formColor,
									roles: validRoles.length > 0 ? validRoles : undefined,
								});
							}}
						>
							{createScenario.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
