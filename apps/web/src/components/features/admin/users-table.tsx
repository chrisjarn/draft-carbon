import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SERVICE_LINES, STATES } from "@/lib/constants";
import { trpc } from "@/utils/trpc";
import type { AppUser, ValidRole } from "./types";
import { ROLE_STYLES, ROLES } from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Hook for user stats (consumed by AdminPage for PageStatsBar) ──────────

export function useUserStats() {
	const query = useQuery(trpc.admin.listUsers.queryOptions());
	const users = (query.data ?? []) as AppUser[];

	const stats = useMemo(() => {
		const admins = users.filter((u) => u.role === "admin").length;
		const pending = users.filter((u) => !u.emailVerified).length;
		return { total: users.length, admins, pending };
	}, [users]);

	return { stats, isPending: query.isPending };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UsersTable({ currentUserId }: { currentUserId?: string }) {
	const qc = useQueryClient();
	const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

	const query = useQuery(trpc.admin.listUsers.queryOptions());
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

	return (
		<>
			{query.isPending ? (
				<div className="flex h-40 items-center justify-center text-text-soft-400 text-sm">
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
								<TableRow key={u.id} className={isMe ? "bg-bg-weak-50/20" : ""}>
									<TableCell>
										<div className="flex items-center gap-2">
											<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-text-strong-950 font-semibold text-[10px] text-bg-white-0">
												{initials(u.name)}
											</div>
											<div>
												<p className="font-medium text-base">{u.name}</p>
												{isMe && (
													<span className="text-[10px] text-text-soft-400">
														You
													</span>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="text-text-soft-400 text-sm">
										{u.email}
									</TableCell>
									<TableCell>
										<RoleBadge role={u.role} />
									</TableCell>
									<TableCell>
										{isMe ? (
											<span className="text-text-soft-400 text-sm">—</span>
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
															label={r.label}
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
															?.name ?? "Select state"}
													</span>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="__none__" label="No state">
														No state
													</SelectItem>
													{STATES.map((s) => (
														<SelectItem
															key={s.id}
															value={s.id}
															label={s.name}
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
														)?.name ?? "Select SL"}
													</span>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="__none__" label="No service line">
														No service line
													</SelectItem>
													{SERVICE_LINES.map((sl) => (
														<SelectItem
															key={sl.id}
															value={sl.id}
															label={sl.name}
															className="text-sm"
														>
															{sl.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<span className="text-text-soft-400 text-sm">—</span>
										)}
									</TableCell>
									<TableCell className="text-text-soft-400 text-sm">
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
												size="icon-sm"
												className="text-text-soft-400 hover:text-destructive"
												onClick={() => setDeleteTarget(u)}
												aria-label={`Delete user ${u.name}`}
											>
												<HugeiconsIcon
													icon={Delete02Icon}
													className="size-3.5"
													aria-hidden="true"
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

			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title="Delete User"
				description={
					<>
						Delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}
						)? This will remove their account and all sessions. This cannot be
						undone.
					</>
				}
				confirmLabel="Delete User"
				pendingLabel="Deleting…"
				loading={deleteUser.isPending}
				onConfirm={() =>
					deleteTarget && deleteUser.mutate({ userId: deleteTarget.id })
				}
			/>
		</>
	);
}
