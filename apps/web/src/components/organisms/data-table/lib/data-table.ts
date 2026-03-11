import type { Column } from "@tanstack/react-table";

import { dataTableConfig } from "@/components/organisms/data-table/config/data-table";
import type {
	ExtendedColumnFilter,
	FilterOperator,
	FilterVariant,
} from "@/components/organisms/data-table/types/data-table";

export function getCommonPinningStyles<TData>({
	column,
	withBorder = false,
}: {
	column: Column<TData>;
	withBorder?: boolean;
}): React.CSSProperties {
	const isPinned = column.getIsPinned();
	const isLastLeftPinnedColumn =
		isPinned === "left" && column.getIsLastColumn("left");
	const isFirstRightPinnedColumn =
		isPinned === "right" && column.getIsFirstColumn("right");

	return {
		background: isPinned ? "var(--primary-foreground)" : undefined,
		boxShadow: withBorder
			? isLastLeftPinnedColumn
				? "-4px 0 4px -4px var(--border) inset"
				: isFirstRightPinnedColumn
					? "4px 0 4px -4px var(--border) inset"
					: undefined
			: undefined,
		left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
		opacity: isPinned ? 0.97 : undefined,
		position: isPinned ? "sticky" : undefined,
		right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
		width: isPinned ? column.getSize() : undefined,
		zIndex: isPinned ? 1 : undefined,
	};
}

export function getFilterOperators(filterVariant: FilterVariant) {
	const operatorMap: Record<
		FilterVariant,
		Array<{ label: string; value: FilterOperator }>
	> = {
		boolean: dataTableConfig.booleanOperators,
		date: dataTableConfig.dateOperators,
		dateRange: dataTableConfig.dateOperators,
		multiSelect: dataTableConfig.multiSelectOperators,
		number: dataTableConfig.numericOperators,
		range: dataTableConfig.numericOperators,
		select: dataTableConfig.selectOperators,
		text: dataTableConfig.textOperators,
	};

	return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
	const operators = getFilterOperators(filterVariant);
	return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq");
}

export function getValidFilters<TData>(
	filters: Array<ExtendedColumnFilter<TData>>,
): Array<ExtendedColumnFilter<TData>> {
	return filters.filter(
		(filter) =>
			filter.operator === "isEmpty" ||
			filter.operator === "isNotEmpty" ||
			(Array.isArray(filter.value)
				? filter.value.length > 0
				: filter.value !== "" &&
					filter.value !== null &&
					filter.value !== undefined),
	);
}
