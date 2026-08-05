import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { CATEGORIES } from "@/lib/tips-content";
import { listArticles } from "@/lib/articles.functions";

export const Route = createFileRoute("/tips/categories")({
  loader: async () => {
    const fn = listArticles;
    const articles = await fn();
    return { articles };
  },
  component: CategoriesPage,
});

function CategoriesPage() {
  const { articles } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <DeviceFrame
      title="Categories"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="space-y-3">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => navigate({ to: "/tips" })}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.tone} ${c.iconTone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.label}</p>
                <p className="truncate text-xs text-muted-foreground">{c.description}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {articles.filter(a => a.category === c.key).length} Articles
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </DeviceFrame>
  );
}
