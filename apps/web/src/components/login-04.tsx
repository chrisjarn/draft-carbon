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
			className="size-7 shrink-0 text-foreground"
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
			<h3 className="mt-6 text-balance font-semibold text-foreground text-lg">
				Sign in to your account
			</h3>
			<p className="mt-2 text-pretty text-base text-muted-foreground">
				Don&apos;t have an account?{" "}
				<button
					type="button"
					onClick={onSwitch}
					className="font-medium text-primary hover:text-primary/90"
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
			<h3 className="mt-6 text-balance font-semibold text-foreground text-lg">
				Create your account
			</h3>
			<p className="mt-2 text-pretty text-base text-muted-foreground">
				Already have an account?{" "}
				<button
					type="button"
					onClick={onSwitch}
					className="font-medium text-primary hover:text-primary/90"
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
		<div className="flex min-h-dvh items-center justify-center">
			<div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<div className="flex items-center space-x-2">
						<CarbonLogo />
						<p className="text-pretty font-semibold text-foreground text-lg">
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
	);
}
