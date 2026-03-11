import Link from "next/link";
import { Button } from "@/components/Button";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "./siteConfig";

export default function NotFound() {
	return (
		<div className="flex h-screen flex-col items-center justify-center">
			<Link
				href={siteConfig.baseLinks.reports}
				aria-label="Go to Insights home page"
			>
				<div className="relative flex items-center justify-center rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5">
					<Logo
						className="size-8 text-blue-500 dark:text-blue-500"
						aria-hidden="true"
					/>
				</div>
			</Link>
			<div className="mt-6 flex flex-col">
				<h1 className="font-semibold text-gray-900 text-lg dark:text-gray-50">
					Insights
				</h1>
			</div>
			<p
				className="mt-6 font-semibold text-4xl text-blue-600 sm:text-5xl dark:text-blue-500"
				aria-hidden="true"
			>
				404
			</p>
			<h2 className="mt-4 font-semibold text-2xl text-gray-900 dark:text-gray-50">
				Page not found
			</h2>
			<p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
				Sorry, we could not find the page you are looking for.
			</p>
			<Button asChild className="group mt-8" variant="light">
				<Link href={siteConfig.baseLinks.reports}>Go to the home page</Link>
			</Button>
		</div>
	);
}
