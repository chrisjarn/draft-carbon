import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { SERVICE_LINES, STATES } from "@/lib/constants";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/admin")({
	component: AdminPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type AppUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	assignedState: string | null;
	assignedServiceLine: string | null;
	emailVerified: boolean;
	createdAt: string;
};

type ValidRole =
	| "admin"
	| "practice_manager"
	| "service_line_lead"
	| "state_manager"
	| "read_only";

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: { value: ValidRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "practice_manager", label: "Practice Manager" },
	{ value: "service_line_lead", label: "Service Line Lead" },
	{ value: "state_manager", label: "State Manager" },
	{ value: "read_only", label: "View Only" },
];

const ROLE_STYLES: Record<string, string> = {
	admin: "border-purple-500/40 bg-purple-500/10 text-purple-400",
	practice_manager: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	service_line_lead: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
	state_manager: "border-teal-500/40 bg-teal-500/10 text-teal-400",
	read_only: "border-border bg-muted/40 text-muted-foreground",
};

function RoleBadge({ role }: { role: string }) {
	const label = ROLES.find((r) => r.value === role)?.label ?? role;
	const cls = ROLE_STYLES[role] ?? ROLE_STYLES.read_only;
	return (
		<Badge variant="outline" size="sm" className={cls}>
			{label}
		</Badge>
	);
}

function initials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function fmtDate(d: Date | string) {
	return new Date(d).toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// ── Page ──────────────────────────────────────────────────────────────────────

function AdminPage() {
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user.id;

	const qc = useQueryClient();
	const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
	const [entityDialogOpen, setEntityDialogOpen] = useState(false);
	const [entityForm, setEntityForm] = useState({ biz: "", state: "" });

	const query = useQuery(trpc.admin.listUsers.queryOptions());
	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());
	const users = (query.data ?? []) as AppUser[];

	const updateRole = useMutation(
		trpc.admin.updateRole.mutationOptions({
			onSuccess: (updated) => {
				qc.invalidateQueries({ queryKey: trpc.admin.listUsers.queryKey() });
				toast.success(
					`${updated.name} is now ${ROLES.find((r) => r.value === updated.role)?.label}`,
				);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteUser = useMutation(
		trpc.admin.deleteUser.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.admin.listUsers.queryKey() });
				setDeleteTarget(null);
				toast.success("User deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const createEntity = useMutation(
		trpc.entities.create.mutationOptions({
			onSuccess: (created) => {
				qc.invalidateQueries({
					queryKey: trpc.entities.getAll.queryKey(),
				});
				setEntityDialogOpen(false);
				setEntityForm({ biz: "", state: "" });
				toast.success(`Entity "${created?.biz ?? "New entity"}" created`);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	return (
		<div className="flex h-full flex-col">
			<PageHeader />

			{/* Table */}
			<div className="flex-1 overflow-auto">
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
						Loading…
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[220px]">User</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Current Role</TableHead>
								<TableHead className="w-[200px]">Change Role</TableHead>
								<TableHead className="w-[180px]">Assignment</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead>Verified</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((u) => {
								const isMe = u.id === currentUserId;
								return (
									<TableRow key={u.id} className={isMe ? "bg-muted/20" : ""}>
										<TableCell>
											<div className="flex items-center gap-2">
												<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-[10px]">
													{initials(u.name)}
												</div>
												<div>
													<p className="font-medium text-base">{u.name}</p>
													{isMe && (
														<span className="text-[10px] text-muted-foreground">
															You
														</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{u.email}
										</TableCell>
										<TableCell>
											<RoleBadge role={u.role} />
										</TableCell>
										<TableCell>
											{isMe ? (
												<span className="text-muted-foreground text-sm">—</span>
											) : (
												<Select
													value={u.role}
													onValueChange={(v) =>
														updateRole.mutate({
															userId: u.id,
															role: v as ValidRole,
														})
													}
													disabled={updateRole.isPending}
												>
													<SelectTrigger size="sm" className="w-44 text-sm">
														<span className="flex flex-1 truncate text-left">
															{ROLES.find((r) => r.value === u.role)?.label ??
																u.role}
														</span>
													</SelectTrigger>
													<SelectContent>
														{ROLES.map((r) => (
															<SelectItem
																key={r.value}
																value={r.value}
																className="text-sm"
															>
																{r.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										</TableCell>
										<TableCell>
											{!isMe && u.role === "state_manager" ? (
												<Select
													value={u.assignedState ?? "__none__"}
													onValueChange={(v) =>
														updateRole.mutate({
															userId: u.id,
															role: u.role as ValidRole,
															assignedState: v === "__none__" ? null : v,
														})
													}
													disabled={updateRole.isPending}
												>
													<SelectTrigger size="sm" className="w-36 text-sm">
														<span className="flex flex-1 truncate text-left">
															{STATES.find((s) => s.id === u.assignedState)
																?.abbr ?? "Select state"}
														</span>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none__">No state</SelectItem>
														{STATES.map((s) => (
															<SelectItem
																key={s.id}
																value={s.id}
																className="text-sm"
															>
																{s.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : !isMe && u.role === "service_line_lead" ? (
												<Select
													value={u.assignedServiceLine ?? "__none__"}
													onValueChange={(v) =>
														updateRole.mutate({
															userId: u.id,
															role: u.role as ValidRole,
															assignedServiceLine: v === "__none__" ? null : v,
														})
													}
													disabled={updateRole.isPending}
												>
													<SelectTrigger size="sm" className="w-36 text-sm">
														<span className="flex flex-1 truncate text-left">
															{SERVICE_LINES.find(
																(sl) => sl.id === u.assignedServiceLine,
															)?.short ?? "Select SL"}
														</span>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none__">
															No service line
														</SelectItem>
														{SERVICE_LINES.map((sl) => (
															<SelectItem
																key={sl.id}
																value={sl.id}
																className="text-sm"
															>
																{sl.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : (
												<span className="text-muted-foreground text-sm">—</span>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{fmtDate(u.createdAt)}
										</TableCell>
										<TableCell>
											<Badge
												variant={u.emailVerified ? "outline" : "secondary"}
												size="sm"
											>
												{u.emailVerified ? "Verified" : "Pending"}
											</Badge>
										</TableCell>
										<TableCell>
											{!isMe && (
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
													onClick={() => setDeleteTarget(u)}
												>
													<HugeiconsIcon
														icon={Delete02Icon}
														className="size-3.5"
													/>
												</Button>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>

			{/* Entities section */}
			<div className="border-border border-t px-6 py-4">
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-base">Entities</h2>
						<p className="text-muted-foreground text-sm">
							{entitiesQuery.data?.length ?? 0} entities
						</p>
					</div>
					<Button
						size="sm"
						onClick={() => {
							setEntityForm({ biz: "", state: "" });
							setEntityDialogOpen(true);
						}}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 size-3.5" />
						Add Entity
					</Button>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{(entitiesQuery.data ?? []).map((e) => (
						<Badge key={e.id} variant="outline" className="text-sm">
							{e.biz}
							{e.state && (
								<span className="ml-1 text-muted-foreground">({e.state})</span>
							)}
						</Badge>
					))}
				</div>
			</div>

			{/* Add Entity dialog */}
			<Dialog
				open={entityDialogOpen}
				onOpenChange={(o) => !o && setEntityDialogOpen(false)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Add Entity</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-muted-foreground">Name *</Label>
							<Input
								value={entityForm.biz}
								onChange={(e) =>
									setEntityForm((f) => ({ ...f, biz: e.target.value }))
								}
								placeholder="e.g. Carbon Perth"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-muted-foreground">
								State *
							</Label>
							<Select
								value={entityForm.state || "__none__"}
								onValueChange={(v) =>
									setEntityForm((f) => ({
										...f,
										state: !v || v === "__none__" ? "" : v,
									}))
								}
							>
								<SelectTrigger className="text-sm">
									<span className="flex flex-1 truncate text-left">
										{STATES.find((s) => s.id === entityForm.state)?.name ??
											"Select state"}
									</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">Select state</SelectItem>
									{STATES.map((s) => (
										<SelectItem key={s.id} value={s.id} className="text-sm">
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEntityDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={
								!entityForm.biz || !entityForm.state || createEntity.isPending
							}
							onClick={() => createEntity.mutate(entityForm)}
						>
							{createEntity.isPending ? "Creating…" : "Create Entity"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete User</DialogTitle>
					</DialogHeader>
					<p className="text-base text-muted-foreground">
						Delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}
						)? This will remove their account and all sessions. This cannot be
						undone.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteTarget(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={deleteUser.isPending}
							onClick={() =>
								deleteTarget && deleteUser.mutate({ userId: deleteTarget.id })
							}
						>
							{deleteUser.isPending ? "Deleting…" : "Delete User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
