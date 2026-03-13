"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-stroke-strong-950 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-10 [button&,a&]:pointer-coarse:after:min-w-11",
	{
		defaultVariants: {
			size: "default",
			variant: "default",
		},
		variants: {
			size: {
				default:
					"h-5.5 min-w-5.5 px-[calc(--spacing(1)-1px)] text-sm sm:h-4.5 sm:min-w-4.5 sm:text-xs",
				lg: "h-6.5 min-w-6.5 px-[calc(--spacing(1.5)-1px)] text-base sm:h-5.5 sm:min-w-5.5 sm:text-sm",
				sm: "h-5 min-w-5 rounded-[.25rem] px-[calc(--spacing(1)-1px)] text-xs sm:h-4 sm:min-w-4 sm:text-[.625rem]",
			},
			variant: {
				default:
					"bg-bg-surface-800 text-text-white-0 [button&,a&]:hover:bg-bg-surface-800/90",
				destructive:
					"bg-error-light text-error-dark [button&,a&]:hover:bg-error-light/90",
				error:
					"bg-error-light text-error-dark",
				info: "bg-information-light text-information-dark",
				outline:
					"ring-1 ring-stroke-soft-200 text-text-sub-600 bg-bg-white-0 [button&,a&]:hover:bg-bg-weak-50",
				secondary:
					"bg-bg-weak-50 text-text-sub-600 [button&,a&]:hover:bg-bg-weak-50/90",
				success: "bg-success-light text-success-dark",
				warning: "bg-warning-light text-warning-dark",
			},
		},
	},
);

interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
	variant?: VariantProps<typeof badgeVariants>["variant"];
	size?: VariantProps<typeof badgeVariants>["size"];
}

function Badge({ className, variant, size, ...props }: BadgeProps) {
	return (
		<span
			className={cn(badgeVariants({ className, size, variant }))}
			data-slot="badge"
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
