import {
	Alert02Icon,
	CancelCircleIcon,
	CheckmarkCircle01Icon,
	InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: (
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
				),
				info: <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />,
				warning: <HugeiconsIcon icon={Alert02Icon} className="size-4" />,
				error: <HugeiconsIcon icon={CancelCircleIcon} className="size-4" />,
				loading: <Spinner className="size-4" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
