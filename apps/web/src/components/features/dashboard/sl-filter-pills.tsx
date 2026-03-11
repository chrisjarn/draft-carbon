import { SERVICE_LINES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ─── SL Filter Pills ─────────────────────────────────────────────────── */

interface SlFilterPillsProps {
	activeSlId: string | null;
	onToggle: (slId: string | null) => void;
}

export function SlFilterPills({ activeSlId, onToggle }: SlFilterPillsProps) {
	return (
		<div className="flex flex-wrap items-center gap-1">
			{SERVICE_LINES.map((sl) => {
				const active = activeSlId === sl.id;
				return (
					<button
						key={sl.id}
						type="button"
						onClick={() => onToggle(active ? null : sl.id)}
						className={cn(
							"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-[11px] transition-colors",
							active
								? "border-transparent bg-foreground text-background"
								: "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
						)}
					>
						<span
							className="size-1.5 shrink-0 rounded-full"
							style={{ backgroundColor: sl.color }}
						/>
						{sl.short}
					</button>
				);
			})}
			{activeSlId && (
				<button
					type="button"
					onClick={() => onToggle(null)}
					className="ml-0.5 text-[11px] text-muted-foreground hover:text-foreground"
				>
					Clear
				</button>
			)}
		</div>
	);
}
