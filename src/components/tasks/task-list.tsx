import { useMemo, useState } from "react";
import { ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTasks, Task, Priority } from "@/hooks/use-tasks";

export function TaskList() {
  const { tasks, isHydrated, addTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const filteredTasks = useMemo(() => {
    if (filter === "todo") return tasks.filter((t) => t.status !== "done");
    if (filter === "done") return tasks.filter((t) => t.status === "done");
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const high = tasks.filter((t) => t.priority === "high" && t.status !== "done").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, high, progress };
  }, [tasks]);

  function handleAdd(data: { title: string; description: string; priority: Priority; dueDate?: string }) {
    addTask(data);
  }

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center text-muted-foreground">
        Loading your tasks...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ListTodo className="h-5 w-5 text-primary" />
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle2 className="h-5 w-5 text-sage" />
              {stats.done}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Priority</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="h-5 w-5 text-coral" />
              {stats.high}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a new task</CardTitle>
          <CardDescription>Quickly capture what you need to focus on.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm onAdd={handleAdd} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your tasks</CardTitle>
            <CardDescription className="mt-1">
              {stats.progress}% complete · {filteredTasks.length} shown
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(["all", "todo", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium text-foreground">No tasks found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "all"
                  ? "Add your first task above to get started."
                  : "Try changing the filter to see more tasks."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
