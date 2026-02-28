import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		// Already logged in → go straight to dashboard
		const session = await authClient.getSession();
		if (session.data) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(true);

	return (
		<div className="flex min-h-svh items-center justify-center bg-background">
			<div className="w-full max-w-md">
				{/* Brand header */}
				<div className="mb-8 flex flex-col items-center gap-2">
					<div className="flex items-center gap-2.5">
						<div
							className="size-8 bg-sidebar-primary"
							style={{
								clipPath:
									"polygon(20% 0%,100% 0%,100% 22%,44% 22%,44% 78%,100% 78%,100% 100%,20% 100%,0% 80%,0% 20%)",
							}}
						/>
						<span className="font-extrabold text-xl tracking-tight">
							Carbon Group
						</span>
					</div>
					<span
						className="font-medium text-muted-foreground text-sm"
						style={{ fontFamily: "cursive" }}
					>
						Workforce Planner
					</span>
				</div>

				{showSignIn ? (
					<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
				) : (
					<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
				)}
			</div>
		</div>
	);
}
