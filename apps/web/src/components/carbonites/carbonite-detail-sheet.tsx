import {
	Delete02Icon,
	PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { DetailRow, DetailSection } from "@/components/shared/detail-display";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { initials } from "@/lib/format";
import type { Carbonite } from "./types";
import { seniorityLabel } from "./types";

export function CarboniteDetailSheet({
	carbonite,
	onClose,
	onEdit,
	onDelete,
	canWriteAccess,
	canAdminAccess,
}: {
	carbonite: Carbonite | null;
	onClose: () => void;
	onEdit: (c: Carbonite) => void;
	onDelete: (c: Carbonite) => void;
	canWriteAccess: boolean;
	canAdminAccess: boolean;
}) {
	return (
		<Sheet open={!!carbonite} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-[380px] sm:w-[420px]">
				{carbonite && (
					<>
						<SheetHeader className="pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
									{initials(carbonite.name)}
								</div>
								<div className="min-w-0 flex-1">
									<SheetTitle className="text-base">
										{carbonite.name}
									</SheetTitle>
									<p className="text-muted-foreground text-xs">
										{carbonite.role ?? "—"}
									</p>
								</div>
							</div>
						</SheetHeader>
						<ScrollArea className="h-[calc(100vh-200px)]">
							<div className="space-y-4 pr-4">
								<DetailSection title="Organisation">
									<DetailRow label="Service Line" value={carbonite.sl} />
									<DetailRow label="Sub Group" value={carbonite.sg} />
									<DetailRow label="State" value={carbonite.state} />
									<DetailRow label="Office" value={carbonite.office} />
									<DetailRow label="Pod" value={carbonite.pod} />
									<DetailRow label="Entity" value={carbonite.entity} />
									<DetailRow label="Reports To" value={carbonite.reportsTo} />
								</DetailSection>
								<DetailSection title="Employment">
									<DetailRow label="Type" value={carbonite.type} />
									<DetailRow label="Location" value={carbonite.location} />
									<DetailRow
										label="Hours / week"
										value={carbonite.hours?.toString()}
									/>
									<DetailRow
										label="Seniority"
										value={`${carbonite.seniority} — ${seniorityLabel(carbonite.seniority)}`}
									/>
									<DetailRow
										label="Salary"
										value={
											carbonite.salary
												? `$${carbonite.salary.toLocaleString()}`
												: undefined
										}
									/>
									<DetailRow
										label="Partner"
										value={carbonite.isPartner ? "Yes" : "No"}
									/>
								</DetailSection>
							</div>
						</ScrollArea>
						{canWriteAccess && (
							<div className="flex gap-2 pt-4">
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => onEdit(carbonite)}
								>
									<HugeiconsIcon
										icon={PencilEdit01Icon}
										className="mr-1.5 size-3"
									/>{" "}
									Edit
								</Button>
								{canAdminAccess && (
									<Button
										size="sm"
										variant="destructive"
										onClick={() => onDelete(carbonite)}
									>
										<HugeiconsIcon icon={Delete02Icon} className="size-3" />
									</Button>
								)}
							</div>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
