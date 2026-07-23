import { useState } from "react";
import { Check, Pencil, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

const priorityStyles: Record<Task["priority"], "coral" | "sage" | "sand"> = {
  high: "coral",
  medium: "sand",
  low: "sage",
};

export function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);

  function saveEdit() {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onUpdate(task.id, { title: trimmed, description: editDescription });
    setIsEditing(false);
  }

  const isDone = task.status === "done";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        isDone && "bg-muted/50",
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          isDone
            ? "border-sage bg-sage text-sage-foreground"
            : "border-muted-foreground/30 hover:border-primary",
        )}
        aria-label={isDone ? "Mark as todo" : "Mark as done"}
      >
        {isDone && <Check className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            <input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditTitle(task.title);
                  setEditDescription(task.description);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className={cn(
                  "font-medium leading-tight",
                  isDone && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </h4>
              <Badge variant={priorityStyles[task.priority]}>
                {task.priority}
              </Badge>
            </div>
            {task.description && (
              <p className={cn("mt-1 text-sm text-muted-foreground", isDone && "line-through")}>
                {task.description}
              </p>
            )}
            {task.dueDate && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 sm:opacity-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsEditing(true)}
          aria-label="Edit task"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
