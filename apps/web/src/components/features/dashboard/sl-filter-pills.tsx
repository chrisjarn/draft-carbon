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
							"inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-medium text-sm transition-colors",
							active
								? "bg-green-alpha-10 text-green-600"
								: "bg-bg-white-0 text-text-soft-400 hover:bg-bg-weak-50 hover:text-text-strong-950",
						)}
					>
						<span
							className="size-2 shrink-0 rounded-full"
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
					className="ml-0.5 text-sm text-text-soft-400 hover:text-text-strong-950"
				>
					Clear
				</button>
			)}
		</div>
	);
}
