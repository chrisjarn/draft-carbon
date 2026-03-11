import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FY_OPTIONS } from "@/lib/constants";

/* ─── Dashboard Greeting Header ────────────────────────────────────────── */

interface DashboardGreetingProps {
	firstName: string | undefined;
	activeFy: string;
	onFyChange: (fy: string | null) => void;
}

export function DashboardGreeting({
	firstName,
	activeFy,
	onFyChange,
}: DashboardGreetingProps) {
	return (
		<div className="flex items-end justify-between pb-5">
			<div>
				<p className="pb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
					Carbon Group · Workforce Planner
				</p>
				<h2 className="font-semibold text-2xl tracking-tight">
					{firstName ? `Hi, ${firstName}` : "Hi"}
				</h2>
			</div>
			<Select value={activeFy} onValueChange={onFyChange}>
				<SelectTrigger className="h-8 w-28 text-xs">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{FY_OPTIONS.map((f) => (
						<SelectItem key={f} value={f}>
							{f}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
