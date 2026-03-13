import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

function CarbonLogo() {
	return (
		<div
			className="size-7 shrink-0 text-text-strong-950"
			style={{
				clipPath:
					"polygon(20% 0%,100% 0%,100% 22%,44% 22%,44% 78%,100% 78%,100% 100%,20% 100%,0% 80%,0% 20%)",
				backgroundColor: "currentColor",
			}}
			aria-hidden="true"
		/>
	);
}

// ── Sign In ───────────────────────────────────────────────────────────────────

function SignInView({ onSwitch }: { onSwitch: () => void }) {
	const navigate = useNavigate({ from: "/" });

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{ email: value.email, password: value.password },
				{
					onSuccess: () => {
						navigate({ to: "/dashboard" });
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<>
			<h3 className="mt-6 text-balance font-semibold text-lg text-text-strong-950">
				Sign in to your account
			</h3>
			<p className="mt-2 text-pretty text-base text-text-soft-400">
				Don&apos;t have an account?{" "}
				<button
					type="button"
					onClick={onSwitch}
					className="font-medium text-green-600 hover:text-green-600/90"
				>
					Sign up
				</button>
			</p>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="mt-8 space-y-4"
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<>
								<Label htmlFor={field.name} className="font-medium text-base">
									Email
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									autoComplete="email"
									placeholder="you@company.com"
									className="mt-2"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="mt-1 text-destructive text-sm"
									>
										{error?.message}
									</p>
								))}
							</>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<>
								<Label htmlFor={field.name} className="font-medium text-base">
									Password
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									autoComplete="current-password"
									placeholder="********"
									className="mt-2"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="mt-1 text-destructive text-sm"
									>
										{error?.message}
									</p>
								))}
							</>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="mt-4 w-full py-2 font-medium"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? "Signing in..." : "Sign in"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

function SignUpView({ onSwitch }: { onSwitch: () => void }) {
	const navigate = useNavigate({ from: "/" });

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{ name: value.name, email: value.email, password: value.password },
				{
					onSuccess: () => {
						navigate({ to: "/dashboard" });
						toast.success("Account created");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<>
			<h3 className="mt-6 text-balance font-semibold text-lg text-text-strong-950">
				Create your account
			</h3>
			<p className="mt-2 text-pretty text-base text-text-soft-400">
				Already have an account?{" "}
				<button
					type="button"
					onClick={onSwitch}
					className="font-medium text-green-600 hover:text-green-600/90"
				>
					Sign in
				</button>
			</p>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="mt-8 space-y-4"
			>
				<div>
					<form.Field name="name">
						{(field) => (
							<>
								<Label htmlFor={field.name} className="font-medium text-base">
									Name
								</Label>
								<Input
									id={field.name}
									name={field.name}
									autoComplete="name"
									placeholder="Your full name"
									className="mt-2"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="mt-1 text-destructive text-sm"
									>
										{error?.message}
									</p>
								))}
							</>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="email">
						{(field) => (
							<>
								<Label htmlFor={field.name} className="font-medium text-base">
									Email
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									autoComplete="email"
									placeholder="you@company.com"
									className="mt-2"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="mt-1 text-destructive text-sm"
									>
										{error?.message}
									</p>
								))}
							</>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<>
								<Label htmlFor={field.name} className="font-medium text-base">
									Password
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									autoComplete="new-password"
									placeholder="********"
									className="mt-2"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="mt-1 text-destructive text-sm"
									>
										{error?.message}
									</p>
								))}
							</>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="mt-4 w-full py-2 font-medium"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? "Creating account..." : "Sign up"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}

// ── Login Page ────────────────────────────────────────────────────────────────

export default function Login04() {
	const { isPending } = authClient.useSession();
	const [isSignIn, setIsSignIn] = useState(true);

	if (isPending) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<Loader />
			</div>
		);
	}

	return (
		<div className="flex min-h-dvh">
			{/* Left panel — dark brand strip */}
			<div
				className="hidden flex-col justify-between p-10 lg:flex lg:w-[42%]"
				style={{ background: "oklch(0.21 0.006 285.885)" }}
			>
				<div className="flex items-center gap-2">
					<CarbonLogo />
					<span
						className="font-extrabold text-base tracking-tight"
						style={{ color: "oklch(0.985 0 0)" }}
					>
						Carbon Group
					</span>
				</div>
				<div>
					<p
						className="mb-2 font-medium text-[10px] uppercase tracking-widest"
						style={{ color: "oklch(0.648 0.2 163.1)" }}
					>
						Workforce Planner
					</p>
					<h2
						className="font-semibold text-2xl leading-snug tracking-tight"
						style={{ color: "oklch(0.985 0 0)" }}
					>
						Plan smarter.
						<br />
						Grow the right team.
					</h2>
					<p
						className="mt-3 text-sm"
						style={{ color: "oklch(0.985 0 0 / 45%)" }}
					>
						Headcount, capacity, and hiring — all in one place.
					</p>
				</div>
				<p className="text-[10px]" style={{ color: "oklch(0.985 0 0 / 25%)" }}>
					© {new Date().getFullYear()} Carbon Group
				</p>
			</div>

			{/* Right panel — form */}
			<div className="flex flex-1 flex-col justify-center bg-bg-weak-50 px-8 py-10 lg:px-12">
				<div className="mx-auto w-full max-w-sm">
					<div className="rounded-20 bg-bg-white-0 p-8 shadow-custom-input">
						{/* Mobile logo */}
						<div className="mb-6 flex items-center space-x-2 lg:hidden">
							<CarbonLogo />
							<p className="font-semibold text-lg text-text-strong-950">
								Carbon Group
							</p>
						</div>

						{isSignIn ? (
							<SignInView onSwitch={() => setIsSignIn(false)} />
						) : (
							<SignUpView onSwitch={() => setIsSignIn(true)} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
