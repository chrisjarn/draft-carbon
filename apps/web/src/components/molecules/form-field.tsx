import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldShellProps {
	field: AnyFieldApi;
	label: string;
	required?: boolean;
	hint?: string;
	className?: string;
	children: ReactNode;
}

/**
 * FormField — TanStack Form adapter that wraps a field with Label, error, and hint.
 *
 * Reads validation state directly from `field.state.meta` so you never
 * need to wire error/hint props manually.
 *
 * Usage:
 *   <form.Field name="salary" validators={{ onSubmit: z.number().min(0) }}>
 *     {(field) => (
 *       <FormField field={field} label="Salary" required>
 *         <Input
 *           id={field.name}
 *           value={field.state.value}
 *           onBlur={field.handleBlur}
 *           onChange={(e) => field.handleChange(e.target.value)}
 *         />
 *       </FormField>
 *     )}
 *   </form.Field>
 */
export function FormField({
	field,
	label,
	required,
	hint,
	className,
	children,
}: FormFieldShellProps) {
	const { meta } = field.state;
	const showError = meta.isTouched && meta.errors.length > 0;
	const errorId = `${field.name}-error`;
	const hintId = `${field.name}-hint`;

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Label htmlFor={field.name} className="text-muted-foreground">
				{label}
				{required && (
					<span aria-hidden="true" className="ml-0.5 text-destructive">
						*
					</span>
				)}
			</Label>
			{children}
			{showError && (
				<p id={errorId} role="alert" className="text-destructive text-xs">
					{meta.errors
						.map((e) =>
							typeof e === "string" ? e : (e as { message?: string })?.message,
						)
						.filter(Boolean)
						.join(", ")}
				</p>
			)}
			{hint && !showError && (
				<p id={hintId} className="text-muted-foreground text-xs">
					{hint}
				</p>
			)}
		</div>
	);
}

// ── CheckboxField ─────────────────────────────────────────────────────────────

interface CheckboxFieldProps {
	field: AnyFieldApi;
	label: string;
	className?: string;
}

/**
 * CheckboxField — inline Checkbox + Label for boolean TanStack Form fields.
 *
 * Usage:
 *   <form.Field name="isPartner">
 *     {(field) => <CheckboxField field={field} label="Partner" />}
 *   </form.Field>
 */
export function CheckboxField({ field, label, className }: CheckboxFieldProps) {
	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			<Checkbox
				id={field.name}
				checked={field.state.value as boolean}
				onCheckedChange={(checked) => field.handleChange(!!checked)}
			/>
			<Label htmlFor={field.name} className="text-xs">
				{label}
			</Label>
		</div>
	);
}
