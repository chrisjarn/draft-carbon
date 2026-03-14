import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
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
			className={cn(
				"group flex w-full items-start gap-3 rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 p-3 text-left transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
			)}
		>
			{/* Avatar */}
			<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-600 font-semibold text-xs text-white">
				{initials(carbonite.name)}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="truncate font-semibold text-sm text-text-strong-950">
					{carbonite.name}
				</div>
				<div className="mt-0.5 truncate text-text-soft-400 text-xs">
					{carbonite.role ?? "—"}
				</div>

				{/* Tags */}
				<div className="mt-2 flex flex-wrap gap-1">
					<span
						className="rounded-md border px-1.5 py-0.5 font-medium text-[10px]"
						style={{
							borderColor: `${slColor(carbonite.sl)}40`,
							color: slColor(carbonite.sl),
							backgroundColor: `${slColor(carbonite.sl)}08`,
						}}
					>
						{slLabel(carbonite.sl)}
					</span>
					{carbonite.state && (
						<span className="rounded-md border border-stroke-soft-200/80 px-1.5 py-0.5 font-medium text-[10px] text-text-soft-400 dark:border-neutral-700">
							{stateLabel(carbonite.state)}
						</span>
					)}
					{carbonite.office && (
						<span className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-medium text-[10px] text-text-sub-600 dark:bg-neutral-800 dark:text-neutral-300">
							{officeLabel(carbonite.office)}
						</span>
					)}
					<span className="rounded-md border border-stroke-soft-200/80 px-1.5 py-0.5 font-medium text-[10px] text-text-soft-400 dark:border-neutral-700">
						{carbonite.type ?? "FT"}
					</span>
				</div>

				{/* Salary */}
				{carbonite.salary != null && (
					<div className="mt-2 text-text-soft-400 text-xs tabular-nums">
						${carbonite.salary.toLocaleString()}
					</div>
				)}
			</div>
		</button>
	);
}
