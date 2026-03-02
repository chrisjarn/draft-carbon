import { PlusSignIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { SERVICE_LINES } from "@/lib/constants";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import type { EntityDetailData } from "./types";

export function HeadcountTargetsSection({
	entityId,
	staff,
	fy,
}: {
	entityId: string;
	staff: EntityDetailData["staff"];
	fy?: string;
}) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formSl, setFormSl] = useState("");
	const [formTarget, setFormTarget] = useState("");
	const [formNotes, setFormNotes] = useState("");

	const { data: targets } = useQuery(
		trpc.wfpExtended.getHeadcountTargets.queryOptions({ entityId, fy }),
	);

	const upsertTarget = useMutation(
		trpc.wfpExtended.upsertHeadcountTarget.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getHeadcountTargets.queryKey(),
				});
				setDialogOpen(false);
				setFormSl("");
				setFormTarget("");
				setFormNotes("");
				toast.success("Target saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const targetMap = new Map((targets ?? []).map((t) => [t.slId, t.target]));

	const slCounts = new Map<string, number>();
	for (const s of staff) {
		if (s.sl) {
			slCounts.set(s.sl, (slCounts.get(s.sl) ?? 0) + 1);
		}
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
					<HugeiconsIcon icon={Target01Icon} className="size-3.5" />
					Headcount Targets
				</h4>
				{hasWriteAccess && (
					<Button variant="ghost" size="xs" onClick={() => setDialogOpen(true)}>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
						Set Target
					</Button>
				)}
			</div>
			<div className="space-y-2">
				{SERVICE_LINES.map((sl) => {
					const current = slCounts.get(sl.id) ?? 0;
					const target = targetMap.get(sl.id) ?? 0;
					const pctVal = target > 0 ? Math.round((current / target) * 100) : 0;
					if (current === 0 && target === 0) return null;
					return (
						<div key={sl.id} className="space-y-1">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<span
										className="inline-block size-2 rounded-full"
										style={{ backgroundColor: sl.color }}
									/>
									<span className="text-sm">{sl.short}</span>
								</div>
								<span className="text-muted-foreground text-xs tabular-nums">
									{current} / {target || "--"}
									{target > 0 && ` (${pctVal}%)`}
								</span>
							</div>
							{target > 0 && (
								<Progress value={Math.min(pctVal, 100)} className="h-1.5" />
							)}
						</div>
					);
				})}
			</div>

			{/* Set Target Dialog */}
			<Dialog
				open={dialogOpen}
				onOpenChange={(o) => !o && setDialogOpen(false)}
			>
				<DialogContent className="max-w-xs">
					<DialogHeader>
						<DialogTitle className="text-base">
							Set Headcount Target
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Service Line
							</Label>
							<Select
								value={formSl || "__none__"}
								onValueChange={(v) =>
									setFormSl(v === "__none__" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="text-sm">
									<SelectValue placeholder="Select SL" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__" disabled>
										Select SL
									</SelectItem>
									{SERVICE_LINES.map((sl) => (
										<SelectItem key={sl.id} value={sl.id}>
											{sl.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Target Headcount
							</Label>
							<Input
								type="number"
								value={formTarget}
								onChange={(e) => setFormTarget(e.target.value)}
								min={0}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Notes (optional)
							</Label>
							<Input
								value={formNotes}
								onChange={(e) => setFormNotes(e.target.value)}
							/>
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
							disabled={!formSl || !formTarget || upsertTarget.isPending}
							onClick={() => {
								upsertTarget.mutate({
									entityId,
									slId: formSl,
									target: Number(formTarget),
									notes: formNotes || undefined,
								});
							}}
						>
							{upsertTarget.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
