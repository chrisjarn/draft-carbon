import type { ColumnSort, Row, RowData } from "@tanstack/react-table";

import type { DataTableConfig } from "@/components/organisms/data-table/config/data-table";

declare module "@tanstack/table-core" {
	interface ColumnMeta<TData extends RowData, TValue> {
		icon?: React.FC<React.SVGProps<SVGSVGElement>>;
		label?: string;
		options?: Option[];
		placeholder?: string;
		range?: [number, number];
		unit?: string;
		variant?: FilterVariant;
	}
}

export interface Option {
	count?: number;
	icon?: React.FC<React.SVGProps<SVGSVGElement>>;
	label: string;
	value: string;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
	id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> {
	filterId: string;
	id: Extract<keyof TData, string>;
	operator: FilterOperator;
	value: string | string[];
	variant: FilterVariant;
}

export interface DataTableRowAction<TData> {
	row: Row<TData>;
	variant: "delete" | "export" | "update" | "view";
}
