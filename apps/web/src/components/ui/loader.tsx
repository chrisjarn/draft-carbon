import { cn } from "@/lib/utils";

export interface LoaderProps {
	variant?:
		| "circular"
		| "dots"
		| "typing"
		| "wave"
		| "bars"
		| "text-blink"
		| "text-shimmer"
		| "loading-dots";
	size?: "sm" | "md" | "lg";
	text?: string;
	className?: string;
}

export function CircularLoader({
	className,
	size = "md",
}: {
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const sizeClasses = {
		sm: "size-4",
		md: "size-5",
		lg: "size-6",
	};

	return (
		<div
			className={cn(
				"animate-spin rounded-full border-2 border-primary border-t-transparent",
				sizeClasses[size],
				className,
			)}
		>
			<span className="sr-only">Loading</span>
		</div>
	);
}

export function DotsLoader({
	className,
	size = "md",
}: {
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const dotSizes = {
		sm: "h-1.5 w-1.5",
		md: "h-2 w-2",
		lg: "h-2.5 w-2.5",
	};

	const containerSizes = {
		sm: "h-4",
		md: "h-5",
		lg: "h-6",
	};

	return (
		<div
			className={cn(
				"flex items-center space-x-1",
				containerSizes[size],
				className,
			)}
		>
			{[...Array(3)].map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: index-only list
					key={i}
					className={cn(
						"animate-bounce rounded-full bg-primary",
						dotSizes[size],
					)}
					style={{
						animationDelay: `${i * 160}ms`,
					}}
				/>
			))}
			<span className="sr-only">Loading</span>
		</div>
	);
}

export function TypingLoader({
	className,
	size = "md",
}: {
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const dotSizes = {
		sm: "h-1 w-1",
		md: "h-1.5 w-1.5",
		lg: "h-2 w-2",
	};

	const containerSizes = {
		sm: "h-4",
		md: "h-5",
		lg: "h-6",
	};

	return (
		<div
			className={cn(
				"flex items-center space-x-1",
				containerSizes[size],
				className,
			)}
		>
			{[...Array(3)].map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: index-only list
					key={i}
					className={cn(
						"animate-bounce rounded-full bg-primary",
						dotSizes[size],
					)}
					style={{
						animationDelay: `${i * 250}ms`,
					}}
				/>
			))}
			<span className="sr-only">Loading</span>
		</div>
	);
}

function Loader({ variant = "typing", size = "md", className }: LoaderProps) {
	switch (variant) {
		case "circular":
			return <CircularLoader size={size} className={className} />;
		case "dots":
			return <DotsLoader size={size} className={className} />;
		case "typing":
			return <TypingLoader size={size} className={className} />;
		default:
			return <TypingLoader size={size} className={className} />;
	}
}

export { Loader };
