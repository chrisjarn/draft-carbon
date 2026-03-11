"use client";
import { usePathname } from "next/navigation";
import type React from "react";
import { Button } from "@/components/Button";
import { Logo } from "@/components/ui/Logo";
import useScroll from "@/lib/useScroll";
import { cx } from "@/lib/utils";

interface Step {
	name: string;
	href: string;
}

const steps: Step[] = [
	{ name: "Product selection", href: "/onboarding/product" },
	{ name: "Employees", href: "/onboarding/employees" },
	{ name: "Infrastructure", href: "/onboarding/infrastructure" },
];

interface StepProgressProps {
	steps: Step[];
}

const StepProgress = ({ steps }: StepProgressProps) => {
	const pathname = usePathname();
	const currentStepIndex = steps.findIndex((step) =>
		pathname.startsWith(step.href),
	);

	return (
		<div aria-label="Onboarding progress">
			<ol className="mx-auto flex w-24 flex-nowrap gap-1 md:w-fit">
				{steps.map((step, index) => (
					<li
						key={step.name}
						className={cx(
							"h-1 w-12 rounded-full",
							index <= currentStepIndex
								? "bg-blue-500"
								: "bg-gray-300 dark:bg-gray-700",
						)}
					>
						<span className="sr-only">
							{step.name}{" "}
							{index < currentStepIndex
								? "completed"
								: index === currentStepIndex
									? "current"
									: ""}
						</span>
					</li>
				))}
			</ol>
		</div>
	);
};

const Layout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const scrolled = useScroll(15);

	return (
		<>
			<header
				className={cx(
					"fixed inset-x-0 top-0 isolate z-50 flex items-center justify-between border-gray-200 border-b bg-gray-50 px-4 transition-all md:grid md:grid-cols-[200px_auto_200px] md:px-6 dark:border-gray-900 dark:bg-gray-925",
					scrolled ? "h-12" : "h-20",
				)}
			>
				<div
					className="hidden flex-nowrap items-center gap-0.5 md:flex"
					aria-hidden="true"
				>
					<Logo
						className="w-7 p-px text-blue-500 dark:text-blue-500"
						aria-hidden="true"
					/>
					<span className="mt-0.5 font-semibold text-gray-900 text-lg dark:text-gray-50">
						Insights
					</span>
				</div>
				<StepProgress steps={steps} />
				<Button variant="ghost" className="ml-auto w-fit" asChild>
					<a href="/reports">Skip to dashboard</a>
				</Button>
			</header>
			<main id="main-content" className="mx-auto mt-28 mb-20 max-w-lg">
				{children}
			</main>
		</>
	);
};

export default Layout;
