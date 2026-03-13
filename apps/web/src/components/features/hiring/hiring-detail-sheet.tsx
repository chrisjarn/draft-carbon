import {
	Briefcase01Icon,
	Cancel01Icon,
	Delete02Icon,
	PencilEdit01Icon,
	Rotate01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	officeLabel,
	sgLabel,
	slLabel,
	stateName,
} from "@/components/features/carbonites/types";
import {
	type HiringNeed,
	HiringStatusBadge,
	PriorityBadge,
	salaryRange,
	TypeBadge,
} from "@/components/features/hiring/hiring-table-columns";
import { SheetGroup, SheetRow } from "@/components/molecules/sheet-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";

export function HiringDetailSheet({
	role,
	onClose,
	onEdit,
	onDelete,
	onCloseRole,
	onReopen,
	canWriteAccess,
}: {
	role: HiringNeed | null;
	onClose: () => void;
	onEdit: (r: HiringNeed) => void;
	onDelete: (r: HiringNeed) => void;
	onCloseRole: (r: HiringNeed) => void;
	onReopen: (r: HiringNeed) => void;
	canWriteAccess: boolean;
}) {
	const isOpen = role?.status !== "closed";
	return (
		<Sheet open={!!role} onOpenChange={(o) => !o && onClose()}>
			<SheetContent>
				{role && (
					<>
						{/* Header: name + salary, badges below */}
						<SheetHeader>
							<div className="flex items-start justify-between gap-3 pr-6">
								<div className="flex items-center gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-text-strong-950 ring-2 ring-emerald-500/20">
										<HugeiconsIcon
											icon={Briefcase01Icon}
											className="size-4"
											aria-hidden="true"
										/>
									</div>
									<SheetTitle className="text-lg leading-tight">
										{role.role}
									</SheetTitle>
								</div>
								<span className="shrink-0 font-semibold text-sm text-text-strong-950 tabular-nums">
									{salaryRange(role.salaryMin, role.salaryMax)}
								</span>
							</div>
							<div className="flex flex-wrap gap-1.5 pl-12">
								<HiringStatusBadge status={role.status} />
								<PriorityBadge priority={role.priority} />
								<TypeBadge type={role.type} />
								{role.positions && role.positions > 1 && (
									<Badge variant="secondary" size="sm">
										{role.positions} positions
									</Badge>
								)}
							</div>
						</SheetHeader>

						{/* Body */}
						<SheetPanel>
							<SheetGroup title="Role Details">
								<SheetRow
									label="Service Line"
									value={slLabel(role.sl ?? null)}
								/>
								<SheetRow
									label="Sub Group"
									value={sgLabel(role.sl ?? null, role.sg ?? null)}
								/>
								<SheetRow label="State" value={stateName(role.state ?? null)} />
								<SheetRow
									label="Office"
									value={officeLabel(role.office ?? null)}
								/>
								<SheetRow label="Location" value={role.location} />
								<SheetRow label="Type" value={role.type} />
								<SheetRow label="Positions" value={role.positions} />
								<SheetRow label="Target Start" value={role.targetStart} />
							</SheetGroup>

							<SheetGroup title="Approvals">
								<SheetRow label="Approved By" value={role.approvedBy} />
								<SheetRow label="Managed By" value={role.managedBy} />
							</SheetGroup>

							{role.notes && (
								<SheetGroup title="Notes">
									<p className="whitespace-pre-wrap py-2.5 text-sm leading-relaxed">
										{role.notes}
									</p>
								</SheetGroup>
							)}

							{!isOpen && (
								<SheetGroup title="Closure">
									<SheetRow label="Outcome" value={role.closedHow} />
									<SheetRow label="Closed Date" value={role.closedDate} />
									<SheetRow label="Hired Name" value={role.closedName} />
								</SheetGroup>
							)}
						</SheetPanel>

						{/* Footer */}
						{canWriteAccess && (
							<SheetFooter>
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => onEdit(role)}
								>
									<HugeiconsIcon
										icon={PencilEdit01Icon}
										className="mr-1.5 size-3.5"
										aria-hidden="true"
									/>
									Edit
								</Button>
								{isOpen ? (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => onCloseRole(role)}
									>
										<HugeiconsIcon
											icon={Cancel01Icon}
											className="mr-1.5 size-3.5"
											aria-hidden="true"
										/>
										Close Role
									</Button>
								) : (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => onReopen(role)}
									>
										<HugeiconsIcon
											icon={Rotate01Icon}
											className="mr-1.5 size-3.5"
											aria-hidden="true"
										/>
										Reopen
									</Button>
								)}
								<Button
									size="sm"
									variant="destructive"
									aria-label={`Delete role ${role.role}`}
									onClick={() => onDelete(role)}
								>
									<HugeiconsIcon
										icon={Delete02Icon}
										className="size-3.5"
										aria-hidden="true"
									/>
								</Button>
							</SheetFooter>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
