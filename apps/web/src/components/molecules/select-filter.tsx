import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function SelectFilter({
	placeholder,
	value,
	options,
	onChange,
}: {
	placeholder: string;
	value: string;
	options: string[];
	onChange: (v: string) => void;
}) {
	return (
		<Select
			value={value || "__all__"}
			onValueChange={(v) => onChange(v ?? "__all__")}
		>
			<SelectTrigger className="w-36 text-sm">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="__all__" label={`All ${placeholder}s`}>
					All {placeholder}s
				</SelectItem>
				{options.map((o) => (
					<SelectItem key={o} value={o}>
						{o}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
