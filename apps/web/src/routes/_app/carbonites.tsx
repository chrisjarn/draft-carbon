import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

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

export const Route = createFileRoute("/_app/carbonites")({
	component: CarbonitesPage,
});

function CarbonitesPage() {
	const { data, isLoading } = useQuery(trpc.carbonite.getAll.queryOptions());
	const [search, setSearch] = useState("");
	const [stateFilter, setStateFilter] = useState("all");
	const [slFilter, setSlFilter] = useState("all");

	const filtered = (data ?? []).filter((c) => {
		if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.role?.toLowerCase().includes(search.toLowerCase())) return false;
		if (stateFilter !== "all" && c.state !== stateFilter) return false;
		if (slFilter !== "all" && c.sl !== slFilter) return false;
		return true;
	});

	const states = [...new Set((data ?? []).map((c) => c.state).filter(Boolean))].sort();
	const serviceLines = [...new Set((data ?? []).map((c) => c.sl).filter(Boolean))].sort();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-extrabold tracking-tight">Carbonites</h1>
					<p className="mt-1 text-xs text-muted-foreground">
						{filtered.length} staff across {states.length} states
					</p>
				</div>
				<Users className="size-5 text-muted-foreground" />
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3">
				<Input
					placeholder="Search name or role..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-xs"
				/>
				<Select value={stateFilter} onValueChange={(v) => setStateFilter(v ?? "all")}>
					<SelectTrigger className="w-32">
						<SelectValue placeholder="State" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All States</SelectItem>
						{states.map((s) => (
							<SelectItem key={s} value={s!}>{s!.toUpperCase()}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={slFilter} onValueChange={(v) => setSlFilter(v ?? "all")}>
					<SelectTrigger className="w-36">
						<SelectValue placeholder="Service Line" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Lines</SelectItem>
						{serviceLines.map((s) => (
							<SelectItem key={s} value={s!}>{s!.toUpperCase()}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>State</TableHead>
							<TableHead>Office</TableHead>
							<TableHead>Service Line</TableHead>
							<TableHead>Pod</TableHead>
							<TableHead className="text-right">Salary</TableHead>
							<TableHead>Type</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 8 }).map((_, i) => (
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
							filtered.map((c) => (
								<TableRow key={c.id}>
									<TableCell className="font-medium">
										{c.name}
										{c.isPartner && (
											<Badge variant="secondary" className="ml-2 text-[10px]">Partner</Badge>
										)}
									</TableCell>
									<TableCell className="text-muted-foreground">{c.role}</TableCell>
									<TableCell>
										<Badge variant="outline">{c.state?.toUpperCase()}</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">{c.office}</TableCell>
									<TableCell>
										<Badge variant="secondary">{c.sl?.toUpperCase()}</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">{c.pod}</TableCell>
									<TableCell className="text-right tabular-nums">
										${(c.salary ?? 0).toLocaleString()}
									</TableCell>
									<TableCell>
										<Badge variant={c.type === "PT" ? "outline" : "default"} className="text-[10px]">
											{c.type}
										</Badge>
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
