import {
	CheckmarkBadge02Icon,
	Delete02Icon,
	Loading01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/organisms/page-header";
import { PageStatsBar } from "@/components/organisms/page-stats-bar";
import { Page, PageBody } from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/todos")({
	component: TodosPage,
});

function TodosPage() {
	const [newTodoText, setNewTodoText] = useState("");

	const todos = useQuery(trpc.todo.getAll.queryOptions());
	const createMutation = useMutation(
		trpc.todo.create.mutationOptions({
			onSuccess: () => {
				todos.refetch();
				setNewTodoText("");
			},
		}),
	);
	const toggleMutation = useMutation(
		trpc.todo.toggle.mutationOptions({ onSuccess: () => todos.refetch() }),
	);
	const deleteMutation = useMutation(
		trpc.todo.delete.mutationOptions({ onSuccess: () => todos.refetch() }),
	);

	const handleAdd = (e: React.FormEvent) => {
		e.preventDefault();
		if (newTodoText.trim()) createMutation.mutate({ text: newTodoText });
	};

	const todoList = todos.data ?? [];
	const completedCount = todoList.filter((t) => t.completed).length;
	const pendingCount = todoList.filter((t) => !t.completed).length;

	return (
		<Page>
			<PageHeader />

			<PageStatsBar
				stats={[
					{ label: "Total", value: todoList.length, loading: todos.isLoading },
					{
						label: "Completed",
						value: completedCount,
						loading: todos.isLoading,
						valueClass: "text-emerald-500",
					},
					{ label: "Pending", value: pendingCount, loading: todos.isLoading },
				]}
			/>

			<PageBody padded constrain="max-w-md">
				<Card>
					<CardHeader>
						<CardTitle>Todo List</CardTitle>
						<CardDescription>Manage your tasks efficiently</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleAdd} className="mb-6 flex items-center gap-2">
							<Input
								value={newTodoText}
								onChange={(e) => setNewTodoText(e.target.value)}
								placeholder="Add a new task…"
								disabled={createMutation.isPending}
							/>
							<Button
								type="submit"
								disabled={createMutation.isPending || !newTodoText.trim()}
							>
								{createMutation.isPending ? (
									<HugeiconsIcon
										icon={Loading01Icon}
										className="size-4 animate-spin"
										aria-hidden="true"
									/>
								) : (
									"Add"
								)}
							</Button>
						</form>

						{todos.isLoading ? (
							<div className="flex justify-center py-4">
								<HugeiconsIcon
									icon={Loading01Icon}
									className="size-6 animate-spin"
									aria-hidden="true"
								/>
							</div>
						) : todos.data?.length === 0 ? (
							<Empty className="py-6 md:py-6">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<HugeiconsIcon icon={CheckmarkBadge02Icon} />
									</EmptyMedia>
									<EmptyTitle className="text-base">No todos yet</EmptyTitle>
									<EmptyDescription>
										Add one above to get started.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<ul className="flex flex-col gap-2">
								{todos.data?.map((todo) => (
									<li
										key={todo.id}
										className="flex items-center justify-between rounded-sm border p-2"
									>
										<div className="flex items-center gap-2">
											<Checkbox
												checked={todo.completed}
												onCheckedChange={() =>
													toggleMutation.mutate({
														id: todo.id,
														completed: !todo.completed,
													})
												}
												id={`todo-${todo.id}`}
											/>
											<label
												htmlFor={`todo-${todo.id}`}
												className={
													todo.completed
														? "text-muted-foreground line-through"
														: ""
												}
											>
												{todo.text}
											</label>
										</div>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => deleteMutation.mutate({ id: todo.id })}
											aria-label="Delete todo"
										>
											<HugeiconsIcon
												icon={Delete02Icon}
												className="size-3.5"
												aria-hidden="true"
											/>
										</Button>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</PageBody>
		</Page>
	);
}
