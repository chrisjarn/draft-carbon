import { createLazyFileRoute } from "@tanstack/react-router";

import Login04 from "@/components/login-04";

export const Route = createLazyFileRoute("/login")({
	component: Login04,
});
