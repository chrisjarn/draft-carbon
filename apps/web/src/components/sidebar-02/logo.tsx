export function CarbonLogo({ className }: { className?: string }) {
	return (
		<div
			className={className}
			style={{
				clipPath:
					"polygon(20% 0%,100% 0%,100% 22%,44% 22%,44% 78%,100% 78%,100% 100%,20% 100%,0% 80%,0% 20%)",
				backgroundColor: "currentColor",
			}}
			aria-hidden="true"
		/>
	);
}
