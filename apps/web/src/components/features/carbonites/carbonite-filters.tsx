import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { SelectFilter } from "@/components/molecules/select-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Carbonite, Filters } from "./types";
import { EMPTY_FILTERS, unique } from "./types";

export function CarboniteFilters({
	filters,
	onChange,
	allData,
}: {
	filters: Filters;
	onChange: (f: Filters) => void;
	allData: Carbonite[];
}) {
	const set = (k: keyof Filters) => (v: string) =>
		onChange({ ...filters, [k]: v === "__all__" ? "" : v });

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Input
				placeholder="Search name, role, pod…"
				value={filters.search}
				onChange={(e) => onChange({ ...filters, search: e.target.value })}
				className="w-52"
			/>
			<SelectFilter
				placeholder="State"
				value={filters.state}
				options={unique(allData, "state")}
				onChange={set("state")}
			/>
			<SelectFilter
				placeholder="Service Line"
				value={filters.sl}
				options={unique(allData, "sl")}
				onChange={set("sl")}
			/>
			<SelectFilter
				placeholder="Office"
				value={filters.office}
				options={unique(allData, "office")}
				onChange={set("office")}
			/>
			<SelectFilter
				placeholder="Type"
				value={filters.type}
				options={["FT", "PT"]}
				onChange={set("type")}
			/>
			{Object.values(filters).some(Boolean) && (
				<Button
					variant="ghost"
					size="sm"
					className="h-10 px-2 text-xs"
					onClick={() => onChange(EMPTY_FILTERS)}
				>
					<HugeiconsIcon icon={Cancel01Icon} className="mr-1 size-3" /> Clear
				</Button>
			)}
		</div>
	);
}
