import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Colour palette ────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
	"#6366f1", // indigo
	"#0891b2", // cyan
	"#059669", // emerald
	"#d97706", // amber
	"#dc2626", // red
	"#7c3aed", // violet
	"#2563eb", // blue
	"#c026d3", // fuchsia
] as const;

function hashInitials(initials: string): number {
	let hash = 0;
	for (let i = 0; i < initials.length; i++) {
		hash = (hash << 5) - hash + initials.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

export function avatarColor(initials: string): string {
	return AVATAR_PALETTE[hashInitials(initials) % AVATAR_PALETTE.length]!;
}

// ── Size map ──────────────────────────────────────────────────────────────────

const SIZE = {
	sm: { avatar: "size-6", text: "text-[10px]" },
	md: { avatar: "size-7", text: "text-xs" },
	lg: { avatar: "size-9", text: "text-sm" },
} as const;

type AvatarSize = keyof typeof SIZE;

// ── Component ─────────────────────────────────────────────────────────────────

export function StaffAvatars({
	initials,
	names,
	headcount,
	size = "md",
	max = 5,
	className,
}: {
	initials: string[];
	names?: string[];
	headcount: number;
	size?: AvatarSize;
	max?: number;
	className?: string;
}) {
	if (headcount === 0) {
		return (
			<span className="text-muted-foreground text-xs">No staff assigned</span>
		);
	}

	const shown = initials.slice(0, max);
	const overflow = initials.length - max;
	const s = SIZE[size];

	return (
		<TooltipProvider>
			<div className={cn("flex items-center gap-0.5", className)}>
				{shown.map((ini, i) => (
					<Tooltip key={`${ini}-${i.toString()}`}>
						<TooltipTrigger
							render={<span style={{ backgroundColor: avatarColor(ini) }} />}
							className={cn(
								"flex cursor-default items-center justify-center rounded-full border-2 border-white font-medium text-white shadow-sm transition-shadow hover:shadow-md",
								s.avatar,
								s.text,
							)}
						>
							{ini}
						</TooltipTrigger>
						<TooltipContent>{names?.[i] ?? ini}</TooltipContent>
					</Tooltip>
				))}
				{overflow > 0 && (
					<Tooltip>
						<TooltipTrigger
							render={<span />}
							className={cn(
								"flex cursor-default items-center justify-center rounded-full border-2 border-white bg-muted font-medium text-muted-foreground shadow-sm transition-shadow hover:shadow-md",
								s.avatar,
								s.text,
							)}
						>
							+{overflow}
						</TooltipTrigger>
						<TooltipContent>+{overflow} more</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);
}
