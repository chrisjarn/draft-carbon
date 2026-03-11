"use client";
import type { Row } from "@tanstack/react-table";
import React from "react";
import { getColumns } from "@/app/(dashboard)/transactions/_components/Columns";
import { DataTable } from "@/app/(dashboard)/transactions/_components/DataTable";
import { DataTableDrawer } from "@/app/(dashboard)/transactions/_components/DataTableDrawer";
import type { Transaction } from "@/data/schema";
import { transactions } from "@/data/transactions";

export default function Example() {
	const [row, setRow] = React.useState<Row<Transaction> | null>(null);
	const [isOpen, setIsOpen] = React.useState(false);
	const datas = row?.original;

	const columns = getColumns({
		onEditClick: (row) => {
			setRow(row);
			setIsOpen(true);
		},
	});

	return (
		<>
			<h1 className="font-semibold text-gray-900 text-lg sm:text-xl dark:text-gray-50">
				Details
			</h1>
			<div className="mt-4 sm:mt-6 lg:mt-10">
				<DataTable
					data={transactions}
					columns={columns}
					onRowClick={(row) => {
						setRow(row);
						setIsOpen(true);
					}}
				/>
				<DataTableDrawer open={isOpen} onOpenChange={setIsOpen} datas={datas} />
			</div>
		</>
	);
}
