import {
	ArrowReloadHorizontalIcon,
	BarChartIcon,
	FilterHorizontalIcon,
	WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

/* ─── Error State ──────────────────────────────────────────────────────── */

export function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex min-h-[40vh] items-center justify-center">
			<Card className="max-w-md text-center">
				<CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
					<HugeiconsIcon
						icon={WifiOff01Icon}
						className="size-10 text-destructive"
					/>
					<div>
						<h2 className="font-semibold text-lg">Connection Error</h2>
						<p className="mt-1 text-base text-text-soft-400">
							Could not reach the API server. Make sure the backend is running
							on port 3000.
						</p>
					</div>
					<Button variant="outline" onClick={onRetry}>
						<HugeiconsIcon
							icon={ArrowReloadHorizontalIcon}
							className="mr-2 size-4"
						/>
						Try Again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

/* ─── Empty State ──────────────────────────────────────────────────────── */

export function DashboardEmptyState({ onRetry }: { onRetry: () => void }) {
	return (
		<Empty className="min-h-[40vh]">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<HugeiconsIcon icon={BarChartIcon} />
				</EmptyMedia>
				<EmptyTitle>No data available</EmptyTitle>
				<EmptyDescription>
					The database is empty. Seed some data or add carbonites and entities
					to get started.
				</EmptyDescription>
			</EmptyHeader>
			<Button variant="outline" onClick={onRetry}>
				<HugeiconsIcon
					icon={ArrowReloadHorizontalIcon}
					className="mr-2 size-4"
				/>
				Try Again
			</Button>
		</Empty>
	);
}

/* ─── Filtered Empty State ─────────────────────────────────────────────── */

export function DashboardFilteredEmptyState({
	onClear,
}: {
	onClear: () => void;
}) {
	return (
		<Empty className="min-h-[40vh]">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<HugeiconsIcon icon={FilterHorizontalIcon} />
				</EmptyMedia>
				<EmptyTitle>No results</EmptyTitle>
				<EmptyDescription>
					No carbonites match the current filter. Try a different combination or
					clear the filter to see all data.
				</EmptyDescription>
			</EmptyHeader>
			<Button variant="outline" onClick={onClear}>
				Clear filter
			</Button>
		</Empty>
	);
}
