import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { stateLabel } from "@/components/features/carbonites/types";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";
import { EntityDialog } from "./entity-dialog";
import type { Entity } from "./types";

// ── Component ─────────────────────────────────────────────────────────────────

export function EntitiesTable() {
	const qc = useQueryClient();
	const [editTarget, setEditTarget] = useState<Entity | null>(null);
	const [deleteEntityTarget, setDeleteEntityTarget] = useState<Entity | null>(
		null,
	);

	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());
	const entitiesData = entitiesQuery.data ?? [];

	const deleteEntity = useMutation(
		trpc.entities.delete.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.entities.getAll.queryKey(),
				});
				setDeleteEntityTarget(null);
				toast.success("Entity deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	return (
		<>
			{entitiesQuery.isPending ? (
				<div className="flex h-40 items-center justify-center text-text-soft-400 text-sm">
					Loading…
				</div>
			) : entitiesData.length === 0 ? (
				<div className="flex h-40 items-center justify-center text-text-soft-400 text-sm">
					No entities. Add one to get started.
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>State</TableHead>
							<TableHead className="text-right">Staff</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{entitiesData.map((e) => (
							<TableRow key={e.id}>
								<TableCell className="font-medium">{e.biz}</TableCell>
								<TableCell>{stateLabel(e.state)}</TableCell>
								<TableCell className="text-right tabular-nums">—</TableCell>
								<TableCell>
									<div className="flex items-center gap-0.5">
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-text-soft-400 hover:text-text-strong-950"
											onClick={() => setEditTarget(e)}
											aria-label={`Edit entity ${e.biz}`}
										>
											<HugeiconsIcon
												icon={PencilEdit01Icon}
												className="size-3.5"
												aria-hidden="true"
											/>
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-text-soft-400 hover:text-destructive"
											onClick={() => setDeleteEntityTarget(e)}
											aria-label={`Delete entity ${e.biz}`}
										>
											<HugeiconsIcon
												icon={Delete02Icon}
												className="size-3.5"
												aria-hidden="true"
											/>
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{/* Edit entity dialog */}
			<EntityDialog
				key={editTarget?.id ?? "none"}
				mode="edit"
				entity={editTarget}
				open={!!editTarget}
				onOpenChange={(o) => !o && setEditTarget(null)}
			/>

			{/* Delete entity confirm */}
			<ConfirmDialog
				open={!!deleteEntityTarget}
				onOpenChange={(o) => !o && setDeleteEntityTarget(null)}
				title="Delete Entity"
				description={
					<>
						Delete <strong>{deleteEntityTarget?.biz}</strong>? Staff assigned to
						this entity will become unassigned. This cannot be undone.
					</>
				}
				confirmLabel="Delete Entity"
				pendingLabel="Deleting…"
				loading={deleteEntity.isPending}
				onConfirm={() =>
					deleteEntityTarget &&
					deleteEntity.mutate({ id: deleteEntityTarget.id })
				}
			/>
		</>
	);
}
