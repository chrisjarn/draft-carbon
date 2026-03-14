// Tremor Divider [v0.0.2] — ported to Carbon WFP

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DividerProps extends React.ComponentPropsWithoutRef<"div"> {
	children?: ReactNode;
}

export function Divider({ className, children, ...props }: DividerProps) {
	return (
		<div
			className={cn(
				"mx-auto my-6 flex w-full items-center justify-between gap-3 text-sm",
				"text-text-soft-400",
				className,
			)}
			{...props}
		>
			{children ? (
				<>
					<div className="h-px w-full bg-border" />
					<div className="whitespace-nowrap text-inherit">{children}</div>
					<div className="h-px w-full bg-border" />
				</>
			) : (
				<div className="h-px w-full bg-border" />
			)}
		</div>
	);
}
