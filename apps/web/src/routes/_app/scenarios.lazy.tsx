import { FlowSquareIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createLazyFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/page-header";

export const Route = createLazyFileRoute("/_app/scenarios")({
	component: ScenariosPage,
});

function ScenariosPage() {
	return (
		<div className="flex h-full flex-col">
			<PageHeader />
			<div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
				<HugeiconsIcon icon={FlowSquareIcon} className="size-10 opacity-30" />
				<p className="text-sm">Scenario planning is coming soon.</p>
				<p className="text-xs">
					In the meantime, scenarios can be managed from the Capacity Plan page.
				</p>
			</div>
		</div>
	);
}
