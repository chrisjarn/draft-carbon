import { Cancel01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	officeLabel,
	slLabel,
	stateLabel,
} from "@/components/features/carbonites/types";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";
import { StatusBadge } from "./pod-row";
import type { Carbonite, PodBudget, SelectedPod } from "./types";

// ── Staff row (private) ──────────────────────────────────────────────────────

function StaffRow({
	member: c,
	onRemove,
}: {
	member: Carbonite;
	onRemove?: () => void;
}) {
	return (
		<div className="group flex items-center justify-between rounded-sm px-2 py-2 hover:bg-muted/40">
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">{c.name ?? "Unknown"}</p>
				<p className="truncate text-muted-foreground text-xs">
					{c.role ?? "No role"}
				</p>
			</div>
			<div className="flex items-center gap-2">
				{c.sl && (
					<Badge variant="outline" size="sm" className="uppercase">
						{slLabel(c.sl, "short")}
					</Badge>
				)}
				<span className="min-w-[60px] text-right font-medium text-sm tabular-nums">
					{fmtDollar(c.salary)}
				</span>
				{onRemove && (
					<button
						type="button"
						onClick={onRemove}
						className="ml-1 rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
						title="Remove from pod"
					>
						<HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
					</button>
				)}
			</div>
		</div>
	);
}

// ── Pod Staff Sheet ──────────────────────────────────────────────────────────

export function PodStaffSheet({
	selectedPod,
	onClose,
	carbonites,
	budgets,
}: {
	selectedPod: SelectedPod | null;
	onClose: () => void;
	carbonites: Carbonite[];
	budgets: PodBudget[];
}) {
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const writable = canWrite(getUserRole(session?.user));

	const [removeTarget, setRemoveTarget] = useState<Carbonite | null>(null);

	const removeMut = useMutation(
		trpc.carbonites.update.mutationOptions({
			onSuccess: () => {
				toast.success(`${removeTarget?.name ?? "Member"} removed from pod`);
				setRemoveTarget(null);
				queryClient.invalidateQueries(trpc.wfp.getStaffWithMeta.queryOptions());
			},
			onError: (err) => {
				toast.error(`Failed to remove: ${err.message}`);
			},
		}),
	);

	const podStaff = selectedPod
		? carbonites.filter(
				(c) =>
					c.state === selectedPod.state &&
					c.office === selectedPod.office &&
					c.pod === selectedPod.podName,
			)
		: [];

	const totalSalary = podStaff.reduce((sum, c) => sum + (c.salary ?? 0), 0);

	const podBudget = selectedPod
		? (budgets.find(
				(b) =>
					b.state === selectedPod.state &&
					b.office === selectedPod.office &&
					b.podName === selectedPod.podName,
			)?.budget ?? 0)
		: 0;

	// Tier grouping
	const partners = podStaff.filter((c) => c.isPartner);
	const leads = podStaff.filter((c) => !c.isPartner && !c.reportsTo);
	const staff = podStaff.filter((c) => !c.isPartner && !!c.reportsTo);

	type TierGroup = { label: string; members: typeof podStaff };
	const tiers: TierGroup[] = [
		{ label: "Partners", members: partners },
		{ label: "Pod Leads", members: leads },
		{ label: "Staff", members: staff },
	].filter((g) => g.members.length > 0);

	const handleRemove = (c: Carbonite) => setRemoveTarget(c);
	const confirmRemove = () => {
		if (!removeTarget) return;
		removeMut.mutate({ id: removeTarget.id, pod: null });
	};

	return (
		<>
			<Sheet open={!!selectedPod} onOpenChange={(open) => !open && onClose()}>
				<SheetContent size="sm">
					{selectedPod && (
						<>
							<SheetHeader>
								<SheetTitle className="flex items-center gap-2">
									<HugeiconsIcon icon={UserGroupIcon} className="size-4" />
									{selectedPod.podName}
								</SheetTitle>
								<SheetDescription>
									{officeLabel(selectedPod.office)} &middot;{" "}
									{stateLabel(selectedPod.state)} &middot; {podStaff.length}{" "}
									staff
								</SheetDescription>
							</SheetHeader>
							<div className="flex items-center gap-6  border-b px-4 py-3">
								<div className="flex flex-col gap-0.5">
									<span className="text-[11px] text-muted-foreground">
										Headcount
									</span>
									<span className="font-semibold text-sm tabular-nums">
										{podStaff.length} / {podBudget}
									</span>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-[11px] text-muted-foreground">
										Staff Cost
									</span>
									<span className="font-semibold text-sm tabular-nums">
										{fmtDollar(totalSalary)}
									</span>
								</div>
								<StatusBadge actual={podStaff.length} budget={podBudget} />
							</div>
							<SheetPanel>
								{podStaff.length === 0 ? (
									<Empty className="py-6 md:py-6">
										<EmptyHeader>
											<EmptyTitle className="text-base">
												No staff assigned
											</EmptyTitle>
										</EmptyHeader>
									</Empty>
								) : tiers.length === 1 && tiers[0]?.label === "Staff" ? (
									<div className="space-y-1">
										{podStaff.map((c) => (
											<StaffRow
												key={c.id}
												member={c}
												onRemove={writable ? () => handleRemove(c) : undefined}
											/>
										))}
									</div>
								) : (
									<div className="space-y-4">
										{tiers.map((tier) => (
											<div key={tier.label}>
												<p className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
													{tier.label}
												</p>
												<div className="space-y-1">
													{tier.members.map((c) => (
														<StaffRow
															key={c.id}
															member={c}
															onRemove={
																writable ? () => handleRemove(c) : undefined
															}
														/>
													))}
												</div>
											</div>
										))}
									</div>
								)}
							</SheetPanel>
							{podStaff.length > 0 && (
								<SheetFooter>
									<div className="flex items-center justify-between">
										<span className="font-medium text-muted-foreground text-sm">
											Total Salary
										</span>
										<span className="font-semibold text-base tabular-nums">
											{fmtDollar(totalSalary)}
										</span>
									</div>
								</SheetFooter>
							)}
						</>
					)}
				</SheetContent>
			</Sheet>

			<ConfirmDialog
				open={!!removeTarget}
				onOpenChange={(open) => !open && setRemoveTarget(null)}
				title="Remove from Pod"
				description={
					<>
						Remove <strong>{removeTarget?.name ?? "this member"}</strong> from{" "}
						<strong>{selectedPod?.podName}</strong>? They will become
						unassigned.
					</>
				}
				confirmLabel="Remove"
				pendingLabel="Removing…"
				loading={removeMut.isPending}
				onConfirm={confirmRemove}
			/>
		</>
	);
}
