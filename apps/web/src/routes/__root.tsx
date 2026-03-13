import type { QueryClient } from "@tanstack/react-query";

import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { Agentation } from "agentation";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";

import "../index.css";

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/react-router-devtools").then((m) => ({
				default: m.TanStackRouterDevtools,
			})),
		);

const ReactQueryDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/react-query-devtools").then((m) => ({
				default: m.ReactQueryDevtools,
			})),
		);

interface RouterAppContext {
	trpc: typeof trpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{ title: "Carbon WFP" },
			{ name: "description", content: "Carbon Group Workforce Planner" },
		],
		links: [{ rel: "icon", href: "/favicon.ico" }],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				forcedTheme="light"
				disableTransitionOnChange
				storageKey="carbon-wfp-theme"
			>
				<Outlet />
				<Toaster richColors />
			</ThemeProvider>
			{import.meta.env.DEV && <Agentation />}
			<Suspense fallback={null}></Suspense>
		</>
	);
}
