import { PlusSignIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
import { FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// ── Schema ────────────────────────────────────────────────────────────────────

const requiredString = z.string().min(1, "Required");
const targetSchema = z
	.string()
	.min(1, "Required")
	.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
		message: "Must be a positive number",
	});

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
				toast.success("Target saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const targetForm = useForm({
		defaultValues: {
			sl: "",
			target: "",
			notes: "",
		},
		onSubmit: ({ value }) => {
			upsertTarget.mutate({
				entityId,
				slId: value.sl,
				target: Number(value.target),
				notes: value.notes || undefined,
			});
		},
	});

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
			<AppDialog
				open={dialogOpen}
				onOpenChange={(o) => {
					if (!o) setDialogOpen(false);
					else targetForm.reset();
				}}
			>
				<AppDialogContent size="sm">
					<AppDialogHeader>
						<AppDialogTitle className="text-base">
							Set Headcount Target
						</AppDialogTitle>
					</AppDialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							targetForm.handleSubmit();
						}}
					>
						<FormGrid>
							<targetForm.Field
								name="sl"
								validators={{ onSubmit: requiredString }}
							>
								{(field) => (
									<FormField field={field} label="Service Line" required>
										<Select
											value={field.state.value || undefined}
											onValueChange={(v) => field.handleChange(v ?? "")}
										>
											<SelectTrigger className="text-sm">
												<SelectValue placeholder="Select SL" />
											</SelectTrigger>
											<SelectContent>
												{SERVICE_LINES.map((sl) => (
													<SelectItem key={sl.id} value={sl.id} label={sl.name}>
														{sl.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormField>
								)}
							</targetForm.Field>

							<targetForm.Field
								name="target"
								validators={{ onSubmit: targetSchema }}
							>
								{(field) => (
									<FormField field={field} label="Target Headcount" required>
										<Input
											id={field.name}
											type="number"
											min={1}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="tabular-nums"
										/>
									</FormField>
								)}
							</targetForm.Field>

							<targetForm.Field name="notes">
								{(field) => (
									<FormField field={field} label="Notes" hint="Optional">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</targetForm.Field>
						</FormGrid>

						<AppDialogFooter>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setDialogOpen(false)}
							>
								Cancel
							</Button>
							<targetForm.Subscribe
								selector={(s) => [s.canSubmit, s.isSubmitting] as const}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										size="sm"
										disabled={
											!canSubmit || isSubmitting || upsertTarget.isPending
										}
									>
										{upsertTarget.isPending ? "Saving..." : "Save"}
									</Button>
								)}
							</targetForm.Subscribe>
						</AppDialogFooter>
					</form>
				</AppDialogContent>
			</AppDialog>
		</div>
	);
}
