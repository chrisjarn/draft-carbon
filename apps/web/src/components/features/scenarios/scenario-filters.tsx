import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { FY_OPTIONS } from "@/lib/constants";

type Entity = {
	id: string;
	biz: string;
	state: string | null;
};

type ScenarioFiltersProps = {
	entity: string | undefined;
	fy: string | undefined;
	entities: Entity[];
	onEntityChange: (id: string | undefined) => void;
	onFyChange: (value: string | undefined) => void;
};

export function ScenarioFilters({
	entity,
	fy,
	entities,
	onEntityChange,
	onFyChange,
}: ScenarioFiltersProps) {
	const entityLabel = entity
		? (entities.find((e) => e.id === entity)?.biz ?? entity)
		: "Select entity...";

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 className="font-semibold text-lg">Scenario Planner</h2>
				<p className="text-muted-foreground text-sm">
					Model the impact of hiring decisions before they're made.
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Select
					value={entity ?? "__none__"}
					onValueChange={(v) =>
						onEntityChange(v === "__none__" ? undefined : v || undefined)
					}
				>
					<SelectTrigger className="w-44 text-sm">
						<span className="flex flex-1 truncate text-left">
							{entityLabel}
						</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__" label="Select entity...">
							Select entity...
						</SelectItem>
						{entities.map((e) => {
							const displayLabel = `${e.biz}${e.state ? ` (${e.state.toUpperCase()})` : ""}`;
							return (
								<SelectItem key={e.id} value={e.id} label={displayLabel}>
									{displayLabel}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
				<Select
					value={fy ?? "__default__"}
					onValueChange={(v) =>
						onFyChange(v === "__default__" ? undefined : v || undefined)
					}
				>
					<SelectTrigger className="w-28 text-sm">
						<span className="flex flex-1 truncate text-left">
							{fy ?? "All FYs"}
						</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__default__" label="All FYs">
							All FYs
						</SelectItem>
						{FY_OPTIONS.map((f) => (
							<SelectItem key={f} value={f}>
								{f}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
