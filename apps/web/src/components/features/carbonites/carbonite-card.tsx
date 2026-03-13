import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import type { Carbonite } from "./types";
import { officeLabel, slColor, slLabel, stateLabel } from "./types";

export function CarboniteCard({
	carbonite,
	onClick,
}: {
	carbonite: Carbonite;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-start gap-3 rounded-lg border  bg-card p-3 text-left transition-colors hover:bg-muted/40"
		>
			<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
				{initials(carbonite.name)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="truncate font-semibold text-sm">{carbonite.name}</div>
				<div className="mt-0.5 truncate text-muted-foreground text-xs">
					{carbonite.role ?? "—"}
				</div>
				<div className="mt-1.5 flex flex-wrap gap-1">
					<Badge
						variant="outline"
						size="sm"
						style={{
							borderColor: `${slColor(carbonite.sl)}40`,
							color: slColor(carbonite.sl),
							backgroundColor: `${slColor(carbonite.sl)}10`,
						}}
					>
						{slLabel(carbonite.sl)}
					</Badge>
					{carbonite.state && (
						<Badge variant="outline" size="sm">
							{stateLabel(carbonite.state)}
						</Badge>
					)}
					{carbonite.office && (
						<Badge variant="secondary" size="sm">
							{officeLabel(carbonite.office)}
						</Badge>
					)}
					<Badge variant="outline" size="sm">
						{carbonite.type ?? "FT"}
					</Badge>
				</div>
				{carbonite.salary != null && (
					<div className="mt-1.5 text-muted-foreground text-xs tabular-nums">
						${carbonite.salary.toLocaleString()}
					</div>
				)}
			</div>
		</button>
	);
}
