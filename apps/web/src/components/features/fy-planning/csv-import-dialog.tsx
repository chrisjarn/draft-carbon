import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	officeLabel,
	stateLabel,
} from "@/components/features/carbonites/types";
import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { fmtDollar } from "@/lib/format";
import { trpc } from "@/utils/trpc";
import { parseCsvRows } from "./types";

export function CsvImportDialog({
	open,
	onClose,
	fy,
}: {
	open: boolean;
	onClose: () => void;
	fy: string;
}) {
	const qc = useQueryClient();
	const [csvText, setCsvText] = useState("");
	const parsed = parseCsvRows(csvText);

	const batchUpsert = useMutation(
		trpc.priorYear.batchUpsert.mutationOptions({
			onSuccess: (data) => {
				qc.invalidateQueries({
					queryKey: trpc.priorYear.getByYear.queryKey({ year: fy }),
				});
				toast.success(`Imported ${data.length} rows`);
				setCsvText("");
				onClose();
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function handleImport() {
		if (parsed.length === 0) return;
		batchUpsert.mutate({
			year: fy,
			rows: parsed.map((r) => ({
				state: r.state,
				office: r.office,
				podName: r.podName,
				budget: r.budget,
			})),
		});
	}

	return (
		<AppDialog
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					setCsvText("");
					onClose();
				}
			}}
		>
			<AppDialogContent size="lg">
				<AppDialogHeader>
					<AppDialogTitle>Import Prior Year Data ({fy})</AppDialogTitle>
				</AppDialogHeader>

				<p className="text-muted-foreground text-sm">
					Paste CSV data with format:{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						state,office,pod_name,budget
					</code>
				</p>

				<Textarea
					value={csvText}
					onChange={(e) => setCsvText(e.target.value)}
					placeholder={
						"nsw,parramatta,Acc & Tax,150000\nvic,elsternwick,BKK,120000"
					}
					className="min-h-24 font-mono text-sm"
				/>

				{parsed.length > 0 && (
					<div className="max-h-48 overflow-auto rounded border border-border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>State</TableHead>
									<TableHead>Office</TableHead>
									<TableHead>Pod</TableHead>
									<TableHead className="text-right">Budget</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{parsed.map((r) => (
									<TableRow key={`${r.state}-${r.office}-${r.podName}`}>
										<TableCell>{stateLabel(r.state)}</TableCell>
										<TableCell>{officeLabel(r.office)}</TableCell>
										<TableCell>{r.podName}</TableCell>
										<TableCell className="text-right tabular-nums">
											{fmtDollar(r.budget)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<AppDialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setCsvText("");
							onClose();
						}}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleImport}
						disabled={parsed.length === 0 || batchUpsert.isPending}
					>
						{batchUpsert.isPending
							? "Importing\u2026"
							: `Import ${parsed.length} rows`}
					</Button>
				</AppDialogFooter>
			</AppDialogContent>
		</AppDialog>
	);
}
