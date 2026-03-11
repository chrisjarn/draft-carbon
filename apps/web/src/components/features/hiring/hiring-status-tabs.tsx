import type { TabStatus } from "@/components/features/hiring/hiring-table-columns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_CONFIG: { value: TabStatus; label: string }[] = [
	{ value: "open", label: "Open" },
	{ value: "active", label: "Active" },
	{ value: "offer", label: "Offer" },
	{ value: "closed", label: "Closed" },
];

export function HiringStatusTabs({
	value,
	counts,
	onValueChange,
}: {
	value: TabStatus;
	counts: Record<TabStatus, number>;
	onValueChange: (v: TabStatus) => void;
}) {
	return (
		<Tabs value={value} onValueChange={(v) => onValueChange(v as TabStatus)}>
			<TabsList variant="underline">
				{TAB_CONFIG.map((t) => (
					<TabsTrigger key={t.value} value={t.value} className="gap-1.5">
						{t.label}
						{counts[t.value] > 0 && (
							<Badge variant="secondary" size="sm" className="tabular-nums">
								{counts[t.value]}
							</Badge>
						)}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
