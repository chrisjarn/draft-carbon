import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/hiring")({
	component: HiringPage,
});

const priorityColors: Record<string, string> = {
	urgent: "bg-red-500/15 text-red-400 border-red-500/30",
	high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
	planned: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const statusColors: Record<string, string> = {
	active: "bg-green-500/15 text-green-400 border-green-500/30",
	open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
	offer: "bg-purple-500/15 text-purple-400 border-purple-500/30",
	closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function HiringPage() {
	const { data, isLoading } = useQuery(trpc.hiring.getAll.queryOptions());
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const filtered = (data ?? []).filter((h) => {
		if (search && !h.role.toLowerCase().includes(search.toLowerCase()) && !h.location?.toLowerCase().includes(search.toLowerCase())) return false;
		if (statusFilter !== "all" && h.status !== statusFilter) return false;
		return true;
	});

	const openCount = (data ?? []).filter((h) => h.status !== "closed").length;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-extrabold tracking-tight">Hiring Pipeline</h1>
					<p className="mt-1 text-xs text-muted-foreground">
						{openCount} open roles · {(data ?? []).length} total
					</p>
				</div>
				<Briefcase className="size-5 text-muted-foreground" />
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3">
				<Input
					placeholder="Search role or location..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-xs"
				/>
				<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
					<SelectTrigger className="w-32">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="open">Open</SelectItem>
						<SelectItem value="offer">Offer</SelectItem>
						<SelectItem value="closed">Closed</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Role</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Service Line</TableHead>
							<TableHead>Positions</TableHead>
							<TableHead>Salary Range</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Target Start</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 6 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 8 }).map((_, j) => (
										<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
									))}
								</TableRow>
							))
						) : filtered.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
									No results.
								</TableCell>
							</TableRow>
						) : (
							filtered.map((h) => (
								<TableRow key={h.id} className={h.status === "closed" ? "opacity-50" : ""}>
									<TableCell>
										<div className="font-medium">{h.role}</div>
										{h.notes && (
											<div className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground">
												{h.notes}
											</div>
										)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{h.location}
										<div className="text-[11px]">{h.state?.toUpperCase()} · {h.office}</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">{h.sl?.toUpperCase()}</Badge>
									</TableCell>
									<TableCell className="text-center tabular-nums">{h.positions}</TableCell>
									<TableCell className="tabular-nums text-xs">
										${((h.salaryMin ?? 0) / 1000).toFixed(0)}k – ${((h.salaryMax ?? 0) / 1000).toFixed(0)}k
									</TableCell>
									<TableCell>
										<Badge variant="outline" className={priorityColors[h.priority ?? ""]}>
											{h.priority}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className={statusColors[h.status ?? ""]}>
											{h.status}
											{h.closedHow && ` (${h.closedHow})`}
										</Badge>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground tabular-nums">
										{h.targetStart}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
