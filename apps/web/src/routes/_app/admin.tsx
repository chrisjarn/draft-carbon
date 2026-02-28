import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/admin")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		const role = (session.data?.user as { role?: string })?.role;
		if (role !== "admin") throw redirect({ to: "/dashboard" });
	},
	component: AdminPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type AppUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	emailVerified: boolean;
	createdAt: string;
};

type ValidRole =
	| "admin"
	| "practice_manager"
	| "sl_lead"
	| "state_manager"
	| "readonly";

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: { value: ValidRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "practice_manager", label: "Practice Manager" },
	{ value: "sl_lead", label: "SL Lead" },
	{ value: "state_manager", label: "State Manager" },
	{ value: "readonly", label: "View Only" },
];

const ROLE_STYLES: Record<string, string> = {
	admin: "border-purple-500/40 bg-purple-500/10 text-purple-400",
	practice_manager: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	sl_lead: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
	state_manager: "border-teal-500/40 bg-teal-500/10 text-teal-400",
	readonly: "border-border bg-muted/40 text-muted-foreground",
};

function RoleBadge({ role }: { role: string }) {
	const label = ROLES.find((r) => r.value === role)?.label ?? role;
	const cls = ROLE_STYLES[role] ?? ROLE_STYLES.readonly;
	return (
		<Badge variant="outline" className={`text-[10px] ${cls}`}>
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
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-border border-b px-6 py-4">
				<div>
					<h1 className="font-extrabold text-lg tracking-tight">Admin</h1>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{users.length} user{users.length !== 1 ? "s" : ""} · role management
					</p>
				</div>
				<Shield className="size-4 text-muted-foreground" />
			</div>

			{/* Table */}
			<div className="flex-1 overflow-auto">
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
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
													<p className="font-medium text-sm">{u.name}</p>
													{isMe && (
														<span className="text-[10px] text-muted-foreground">
															You
														</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{u.email}
										</TableCell>
										<TableCell>
											<RoleBadge role={u.role} />
										</TableCell>
										<TableCell>
											{isMe ? (
												<span className="text-muted-foreground text-xs">—</span>
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
													<SelectTrigger className="h-7 w-44 text-xs">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{ROLES.map((r) => (
															<SelectItem
																key={r.value}
																value={r.value}
																className="text-xs"
															>
																{r.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{fmtDate(u.createdAt)}
										</TableCell>
										<TableCell>
											<Badge
												variant={u.emailVerified ? "outline" : "secondary"}
												className="text-[10px]"
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
													<Trash2 className="size-3.5" />
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

			{/* Delete confirm */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete User</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
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
