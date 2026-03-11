export function DetailSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
				{title}
			</p>
			<div className="space-y-1.5">{children}</div>
		</div>
	);
}

export function DetailRow({
	label,
	value,
}: {
	label: string;
	value?: string | null;
}) {
	return (
		<div className="flex items-baseline justify-between gap-2">
			<span className="text-muted-foreground text-sm">{label}</span>
			<span className="text-right font-medium text-sm">{value ?? "—"}</span>
		</div>
	);
}
