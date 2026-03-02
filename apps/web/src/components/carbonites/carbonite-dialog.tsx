import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getOfficesForState,
	getSubgroupsForSL,
	SERVICE_LINES,
	STATES,
} from "@/lib/constants";
import type { FormState } from "./types";

export function CarboniteDialog({
	open,
	onClose,
	initial,
	onSave,
	saving,
}: {
	open: boolean;
	onClose: () => void;
	initial: FormState;
	onSave: (f: FormState) => void;
	saving: boolean;
}) {
	// Parent passes key={editTarget?.id ?? "create"} to force remount,
	// so useState(initial) correctly initializes on each mount.
	const [form, setForm] = useState<FormState>(initial);

	const set = (k: keyof FormState) => (v: string | boolean | null) =>
		setForm((p) => ({ ...p, [k]: v ?? "" }));

	const officeOptions = form.state ? getOfficesForState(form.state) : [];
	const sgOptions = form.sl ? getSubgroupsForSL(form.sl) : [];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{initial.name ? "Edit Carbonite" : "Add Carbonite"}
					</DialogTitle>
				</DialogHeader>
				<ScrollArea className="max-h-[60vh]">
					<div className="grid grid-cols-2 gap-3 p-1">
						<div className="col-span-2">
							<Label className="mb-1 block text-muted-foreground">Name *</Label>
							<Input
								value={form.name}
								onChange={(e) => set("name")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">Role</Label>
							<Input
								value={form.role}
								onChange={(e) => set("role")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Service Line
							</Label>
							<Select
								value={form.sl || "__none__"}
								onValueChange={(v) => {
									set("sl")(v === "__none__" ? "" : v);
									set("sg")("");
								}}
							>
								<SelectTrigger className="text-xs">
									<SelectValue placeholder="Select…" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">None</SelectItem>
									{SERVICE_LINES.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Sub Group
							</Label>
							{sgOptions.length > 0 ? (
								<Select
									value={form.sg || "__none__"}
									onValueChange={(v) => set("sg")(v === "__none__" ? "" : v)}
								>
									<SelectTrigger className="text-xs">
										<SelectValue placeholder="Select…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">None</SelectItem>
										{sgOptions.map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{s.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<Input
									value={form.sg}
									onChange={(e) => set("sg")(e.target.value)}
									className="h-8 text-xs"
								/>
							)}
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">State</Label>
							<Select
								value={form.state || "__none__"}
								onValueChange={(v) => {
									set("state")(v === "__none__" ? "" : v);
									set("office")("");
								}}
							>
								<SelectTrigger className="text-xs">
									<SelectValue placeholder="Select…" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">None</SelectItem>
									{STATES.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">Office</Label>
							{officeOptions.length > 0 ? (
								<Select
									value={form.office || "__none__"}
									onValueChange={(v) =>
										set("office")(v === "__none__" ? "" : v)
									}
								>
									<SelectTrigger className="text-xs">
										<SelectValue placeholder="Select…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">None</SelectItem>
										{officeOptions.map((o) => (
											<SelectItem key={o.id} value={o.id}>
												{o.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<Input
									value={form.office}
									onChange={(e) => set("office")(e.target.value)}
									className="h-8 text-xs"
								/>
							)}
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">Pod</Label>
							<Input
								value={form.pod}
								onChange={(e) => set("pod")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">Entity</Label>
							<Input
								value={form.entity}
								onChange={(e) => set("entity")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">Type</Label>
							<Select value={form.type} onValueChange={(v) => set("type")(v)}>
								<SelectTrigger className="text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="FT">Full Time</SelectItem>
									<SelectItem value="PT">Part Time</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Seniority (1-10)
							</Label>
							<Input
								type="number"
								min={1}
								max={10}
								value={form.seniority}
								onChange={(e) => set("seniority")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">Salary</Label>
							<Input
								type="number"
								value={form.salary}
								onChange={(e) => set("salary")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								Hours / week
							</Label>
							<Input
								type="number"
								value={form.hours}
								onChange={(e) => set("hours")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div className="col-span-2">
							<Label className="mb-1 block text-muted-foreground">
								Location
							</Label>
							<Input
								value={form.location}
								onChange={(e) => set("location")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div className="col-span-2">
							<Label className="mb-1 block text-muted-foreground">
								Reports To
							</Label>
							<Input
								value={form.reportsTo}
								onChange={(e) => set("reportsTo")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div className="col-span-2 flex items-center gap-2">
							<Checkbox
								id="isPartner"
								checked={form.isPartner}
								onCheckedChange={(checked) => set("isPartner")(!!checked)}
							/>
							<Label htmlFor="isPartner" className="text-xs">
								Partner
							</Label>
						</div>
					</div>
				</ScrollArea>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						disabled={!form.name || saving}
						onClick={() => onSave(form)}
					>
						{saving ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
