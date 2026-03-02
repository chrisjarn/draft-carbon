import { Delete02Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

	return (
		<div className="flex h-full flex-col">
			<PageHeader />

			<div className="flex-1 overflow-auto p-6">
				<div className="mx-auto max-w-md">
					<Card>
						<CardHeader>
							<CardTitle>Todo List</CardTitle>
							<CardDescription>Manage your tasks efficiently</CardDescription>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={handleAdd}
								className="mb-6 flex items-center gap-2"
							>
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
									/>
								</div>
							) : todos.data?.length === 0 ? (
								<p className="py-4 text-center text-muted-foreground text-base">
									No todos yet. Add one above!
								</p>
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
												/>
											</Button>
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
