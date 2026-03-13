/**
 * ConfirmDialog — standardized destructive/confirm action dialog.
 *
 * Consolidates the repeated "are you sure?" pattern across the app.
 * All four previous hand-rolled confirm dialogs are replaced by this.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={!!deleteTarget}
 *     onOpenChange={(o) => !o && setDeleteTarget(null)}
 *     title="Delete Role"
 *     description={<>Delete <strong>{deleteTarget?.role}</strong>? This cannot be undone.</>}
 *     confirmLabel="Delete"
 *     pendingLabel="Deleting…"
 *     loading={deleteMut.isPending}
 *     onConfirm={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
 *   />
 */
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "./app-dialog";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: ReactNode;
	/** Label for the confirm button. Defaults to "Confirm". */
	confirmLabel?: string;
	/** Label for the cancel button. Defaults to "Cancel". */
	cancelLabel?: string;
	/**
	 * Whether the confirm button uses the destructive variant.
	 * Defaults to true — most confirms in this app are deletions.
	 */
	destructive?: boolean;
	/** Shows a loading state on the confirm button. */
	loading?: boolean;
	/** Label shown while loading. Defaults to confirmLabel + "…" */
	pendingLabel?: string;
	onConfirm: () => void;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = true,
	loading = false,
	pendingLabel,
	onConfirm,
}: ConfirmDialogProps) {
	return (
		<AppDialog open={open} onOpenChange={onOpenChange}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle>{title}</AppDialogTitle>
				</AppDialogHeader>
				<p className="text-text-soft-400 text-sm">{description}</p>
				<AppDialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						{cancelLabel}
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						size="sm"
						disabled={loading}
						onClick={onConfirm}
					>
						{loading ? (pendingLabel ?? `${confirmLabel}…`) : confirmLabel}
					</Button>
				</AppDialogFooter>
			</AppDialogContent>
		</AppDialog>
	);
}
