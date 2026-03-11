import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type StepDialogContextProps = {
	step: number;
	totalSteps: number;
	goNext: () => Promise<void>;
	goBack: () => void;
	goTo: (step: number) => void;
	/** Register a validation callback for a specific step. Returns true to allow navigation. */
	registerBeforeNext: (
		step: number,
		fn: (() => Promise<boolean>) | null,
	) => void;
};

const StepDialogContext = React.createContext<StepDialogContextProps | null>(
	null,
);

function useStepDialog() {
	const ctx = React.useContext(StepDialogContext);
	if (!ctx) throw new Error("useStepDialog must be used within <StepDialog />");
	return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

type StepDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	totalSteps: number;
	children: React.ReactNode;
};

function StepDialog({
	open,
	onOpenChange,
	totalSteps,
	children,
}: StepDialogProps) {
	const [step, setStep] = React.useState(1);
	const beforeNextRef = React.useRef<Map<number, () => Promise<boolean>>>(
		new Map(),
	);

	// Reset to step 1 whenever the dialog opens
	React.useEffect(() => {
		if (open) setStep(1);
	}, [open]);

	const registerBeforeNext = React.useCallback(
		(s: number, fn: (() => Promise<boolean>) | null) => {
			if (fn) {
				beforeNextRef.current.set(s, fn);
			} else {
				beforeNextRef.current.delete(s);
			}
		},
		[],
	);

	const goNext = React.useCallback(async () => {
		const guard = beforeNextRef.current.get(step);
		if (guard) {
			const ok = await guard();
			if (!ok) return;
		}
		setStep((s) => Math.min(s + 1, totalSteps));
	}, [step, totalSteps]);

	const goBack = React.useCallback(() => {
		setStep((s) => Math.max(s - 1, 1));
	}, []);

	const goTo = React.useCallback(
		(s: number) => {
			if (s >= 1 && s <= totalSteps) setStep(s);
		},
		[totalSteps],
	);

	return (
		<StepDialogContext.Provider
			value={{ step, totalSteps, goNext, goBack, goTo, registerBeforeNext }}
		>
			<Dialog open={open} onOpenChange={onOpenChange}>
				{children}
			</Dialog>
		</StepDialogContext.Provider>
	);
}

// ---------------------------------------------------------------------------
// Content — passes through to DialogContent
// ---------------------------------------------------------------------------

function StepDialogContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogContent>) {
	return (
		<DialogContent
			className={cn("gap-0 overflow-hidden p-0 sm:max-w-xl", className)}
			showCloseButton={false}
			{...props}
		>
			{children}
		</DialogContent>
	);
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

type StepDialogHeaderProps = {
	title: React.ReactNode;
	description?: React.ReactNode;
	className?: string;
};

function StepDialogHeader({
	title,
	description,
	className,
}: StepDialogHeaderProps) {
	return (
		<DialogHeader className={cn("px-5 pt-5 pb-0", className)}>
			<DialogTitle>{title}</DialogTitle>
			{description && <DialogDescription>{description}</DialogDescription>}
		</DialogHeader>
	);
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

type StepDialogIndicatorProps = {
	labels?: string[];
	className?: string;
};

function StepDialogIndicator({ labels, className }: StepDialogIndicatorProps) {
	const { step, totalSteps } = useStepDialog();

	return (
		<div
			data-slot="step-dialog-indicator"
			className={cn("flex items-center gap-0 px-5 py-4", className)}
		>
			{Array.from({ length: totalSteps }, (_, i) => {
				const num = i + 1;
				const isDone = num < step;
				const isActive = num === step;

				return (
					<React.Fragment key={num}>
						<div className="flex flex-col items-center gap-1">
							<div
								className={cn(
									"flex size-7 items-center justify-center rounded-full border font-medium text-xs transition-colors",
									isDone && "border-emerald-500 bg-emerald-500 text-white",
									isActive &&
										"border-primary bg-primary text-primary-foreground",
									!isDone &&
										!isActive &&
										"border-border bg-muted text-muted-foreground",
								)}
							>
								{isDone ? <HugeiconsIcon icon={Tick01Icon} size={12} /> : num}
							</div>
							{labels?.[i] && (
								<span
									className={cn(
										"whitespace-nowrap text-xs",
										isActive
											? "font-medium text-foreground"
											: "text-muted-foreground",
									)}
								>
									{labels[i]}
								</span>
							)}
						</div>
						{i < totalSteps - 1 && (
							<div
								className={cn(
									"mx-2 mb-4 h-px flex-1 transition-colors",
									isDone ? "bg-emerald-500" : "bg-border",
								)}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Body — scrollable content area
// ---------------------------------------------------------------------------

function StepDialogBody({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="step-dialog-body"
			className={cn("max-h-[60vh] overflow-y-auto px-5 py-4", className)}
			{...props}
		>
			{children}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step — renders only when active
// ---------------------------------------------------------------------------

type StepDialogStepProps = {
	step: number;
	/**
	 * Called when the user clicks Next on this step.
	 * Return true to proceed, false to block navigation.
	 * Typically used to trigger form validation.
	 */
	onBeforeNext?: () => Promise<boolean>;
	children: React.ReactNode;
};

function StepDialogStep({
	step: stepNum,
	onBeforeNext,
	children,
}: StepDialogStepProps) {
	const { step, registerBeforeNext } = useStepDialog();

	React.useEffect(() => {
		if (onBeforeNext) {
			registerBeforeNext(stepNum, onBeforeNext);
			return () => registerBeforeNext(stepNum, null);
		}
	}, [stepNum, onBeforeNext, registerBeforeNext]);

	if (step !== stepNum) return null;
	return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

type StepDialogFooterProps = {
	onSubmit: () => void | Promise<void>;
	submitLabel?: string;
	isSubmitting?: boolean;
	className?: string;
};

function StepDialogFooter({
	onSubmit,
	submitLabel = "Save",
	isSubmitting = false,
	className,
}: StepDialogFooterProps) {
	const { step, totalSteps, goNext, goBack } = useStepDialog();
	const isLast = step === totalSteps;

	return (
		<div
			data-slot="step-dialog-footer"
			className={cn(
				"flex items-center justify-between border-border border-t px-5 py-3",
				className,
			)}
		>
			{/* Left: Back */}
			<div>
				{step > 1 ? (
					<Button variant="ghost" onClick={goBack} type="button">
						<HugeiconsIcon icon={ArrowLeft01Icon} />
						Back
					</Button>
				) : (
					<DialogClose render={<Button variant="ghost" type="button" />}>
						Cancel
					</DialogClose>
				)}
			</div>

			{/* Right: Next / Submit */}
			<div className="flex items-center gap-2">
				{!isLast && (
					<Button onClick={goNext} type="button">
						Next
						<HugeiconsIcon icon={ArrowRight01Icon} />
					</Button>
				)}
				{isLast && (
					<Button onClick={onSubmit} disabled={isSubmitting} type="button">
						{isSubmitting ? "Saving…" : submitLabel}
						{!isSubmitting && <HugeiconsIcon icon={CheckmarkCircle02Icon} />}
					</Button>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
	StepDialog,
	StepDialogContent,
	StepDialogHeader,
	StepDialogIndicator,
	StepDialogBody,
	StepDialogStep,
	StepDialogFooter,
	useStepDialog,
};
