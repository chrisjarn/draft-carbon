import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

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

export const Route = createFileRoute("/_app/todos")({
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
		<div className="p-6">
			<div className="mb-6">
				<h1 className="font-extrabold text-lg tracking-tight">Todos</h1>
				<p className="mt-1 text-muted-foreground text-xs">Manage your tasks</p>
			</div>

			<div className="mx-auto max-w-md">
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
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Add"
								)}
							</Button>
						</form>

						{todos.isLoading ? (
							<div className="flex justify-center py-4">
								<Loader2 className="size-6 animate-spin" />
							</div>
						) : todos.data?.length === 0 ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
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
											<Trash2 className="size-3.5" />
										</Button>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
