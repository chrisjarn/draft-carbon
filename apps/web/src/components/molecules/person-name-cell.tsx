import { avatarColor } from "@/components/molecules/staff-avatars";
import { initials } from "@/lib/format";

export function PersonNameCell({
	name,
	className,
}: {
	name: string;
	className?: string;
}) {
	const ini = initials(name);
	const color = avatarColor(ini);
	return (
		<div className={`flex items-center gap-2 ${className ?? ""}`}>
			<span
				className="flex size-6 shrink-0 items-center justify-center rounded-full font-semibold text-[10px] text-white"
				style={{ backgroundColor: color }}
			>
				{ini}
			</span>
			<span className="font-medium text-sm">{name}</span>
		</div>
	);
}
