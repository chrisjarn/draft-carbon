import {
	Alert02Icon,
	PlusSignIcon,
	SearchList01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { authClient } from "@/lib/auth-client";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import { EditRiskDialog, FlagRiskDialog } from "./attrition-risk-form-dialog";
import { AttritionRisksTable } from "./attrition-risks-table";
import { AutoDetectedRisks } from "./auto-detected-risks";
import type { EntityDetailData, RiskLevel } from "./types";

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
	const [showAutoResults, setShowAutoResults] = useState(false);
	const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
	const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

	const { data: risks } = useQuery(
		trpc.wfpExtended.getAttritionRisks.queryOptions({ entityId }),
	);

	const { data: autoDetected, isFetching: autoDetectLoading } = useQuery({
		...trpc.wfpExtended.autoDetectRisks.queryOptions({ entityId }),
		enabled: autoDetectEnabled,
	});

	const visibleAutoDetected = (autoDetected ?? []).filter(
		(r) => !dismissedIds.has(r.carboniteId),
	);

	const invalidateRisks = () => {
		qc.invalidateQueries({
			queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
		});
		qc.invalidateQueries({
			queryKey: trpc.wfp.firmKPIs.queryKey(),
		});
	};

	const createRisk = useMutation(
		trpc.wfpExtended.createAttritionRisk.mutationOptions({
			onSuccess: () => {
				invalidateRisks();
				setFlagOpen(false);
				toast.success("Risk flagged");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const updateRisk = useMutation(
		trpc.wfpExtended.updateAttritionRisk.mutationOptions({
			onSuccess: () => {
				invalidateRisks();
				setEditRisk(null);
				toast.success("Risk updated");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteRisk = useMutation(
		trpc.wfpExtended.deleteAttritionRisk.mutationOptions({
			onSuccess: () => {
				invalidateRisks();
				toast.success("Risk removed");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const riskIds = new Set((risks ?? []).map((r) => r.carboniteId));
	const staffMap = new Map(staff.map((s) => [s.id, s]));
	const availableStaff = staff.filter((s) => !riskIds.has(s.id));

	function openEdit(riskId: string) {
		setEditRisk(riskId);
	}

	const editingRisk = editRisk
		? (risks ?? []).find((x) => x.id === editRisk)
		: null;

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
					<HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
					Attrition Risks
				</h4>
				{hasWriteAccess && (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-6 text-xs"
							onClick={() => {
								setDismissedIds(new Set());
								setAutoDetectEnabled(true);
								setShowAutoResults(true);
							}}
							disabled={autoDetectLoading}
						>
							<HugeiconsIcon icon={SearchList01Icon} className="mr-1 size-3" />
							{autoDetectLoading ? "Scanning..." : "Auto-detect"}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 text-xs"
							onClick={() => setFlagOpen(true)}
						>
							<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
							Flag Risk
						</Button>
					</div>
				)}
			</div>

			{showAutoResults && (
				<AutoDetectedRisks
					risks={visibleAutoDetected}
					onAccept={(r) => {
						createRisk.mutate({
							carboniteId: r.carboniteId,
							riskLevel: r.riskLevel as RiskLevel,
							reason: r.reason,
							action: "Auto-detected",
						});
						setDismissedIds((prev) => new Set(prev).add(r.carboniteId));
					}}
					onDismiss={(id) => setDismissedIds((prev) => new Set(prev).add(id))}
					onDismissAll={() => setShowAutoResults(false)}
				/>
			)}

			{(risks ?? []).length === 0 ? (
				<Empty className="py-6 md:py-6">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Alert02Icon} />
						</EmptyMedia>
						<EmptyTitle className="text-base">
							No attrition risks flagged
						</EmptyTitle>
					</EmptyHeader>
				</Empty>
			) : (
				<AttritionRisksTable
					risks={risks ?? []}
					staffMap={staffMap}
					hasWriteAccess={hasWriteAccess}
					onEdit={openEdit}
					onDelete={(id) => deleteRisk.mutate({ id })}
				/>
			)}

			<FlagRiskDialog
				key={String(flagOpen)}
				open={flagOpen}
				onOpenChange={setFlagOpen}
				availableStaff={availableStaff}
				isPending={createRisk.isPending}
				onSubmit={(payload) => {
					createRisk.mutate(payload);
				}}
			/>

			<EditRiskDialog
				key={editRisk ?? "none"}
				open={!!editRisk}
				onOpenChange={() => setEditRisk(null)}
				initialLevel={(editingRisk?.riskLevel as RiskLevel) ?? "medium"}
				initialReason={editingRisk?.reason ?? ""}
				initialAction={editingRisk?.action ?? ""}
				isPending={updateRisk.isPending}
				onSubmit={(payload) => {
					if (!editRisk) return;
					updateRisk.mutate({
						id: editRisk,
						...payload,
					});
				}}
			/>
		</div>
	);
}
