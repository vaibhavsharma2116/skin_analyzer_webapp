import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bookmark, Share2, ThumbsDown, ThumbsUp, UserCircle } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { ARTICLES_BY_SLUG, type Article } from "@/lib/tips-content";

export const Route = createFileRoute("/tips/article/$slug")({
  loader: ({ params }) => {
    const article = ARTICLES_BY_SLUG[params.slug];
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — SKIN POP` },
          { name: "description", content: loaderData.article.summary },
        ]
      : [{ title: "Article — SKIN POP" }, { name: "robots", content: "noindex" }],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const data = Route.useLoaderData() as { article: Article };
  const article = data.article;
  const navigate = useNavigate();
  const [helpful, setHelpful] = useState<"yes" | "no" | null>(null);

  return (
    <DeviceFrame
      title=""
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={
        <div className="flex items-center gap-1">
          <button className="icon-button" aria-label="Bookmark"><Bookmark className="h-4 w-4" /></button>
          <button className="icon-button" aria-label="Share"><Share2 className="h-4 w-4" /></button>
        </div>
      }
    >
      <div className={`flex h-40 items-center justify-center rounded-[24px] bg-gradient-to-br ${article.gradient} text-6xl`}>
        {article.hero ?? "✨"}
      </div>

      <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        {article.categoryLabel}
      </span>
      <h1 className="mt-2 text-xl font-semibold leading-tight">{article.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <UserCircle className="h-4 w-4" />
        <span>By {article.author}</span>
        <span>·</span>
        <span>{article.date}</span>
        <span>·</span>
        <span>{article.readMinutes} min read</span>
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold">In this article</p>
        <ul className="mt-2 space-y-1 text-sm">
          {article.toc.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 space-y-5">
        {article.sections.map((s, i) => {
          if (s.kind === "paragraph") {
            return <p key={i} className="text-sm leading-relaxed text-foreground/90">{s.text}</p>;
          }
          if (s.kind === "takeaway") {
            return (
              <div key={i} className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-primary">{s.title}</p>
                <p className="mt-1 text-sm">{s.text}</p>
              </div>
            );
          }
          if (s.kind === "protip") {
            return (
              <div key={i} className="rounded-2xl border border-coral/30 bg-coral/5 p-4">
                <p className="text-sm font-semibold text-coral">Pro Tip</p>
                <p className="mt-1 text-sm">{s.text}</p>
              </div>
            );
          }
          if (s.kind === "howto") {
            return (
              <div key={i}>
                <p className="text-base font-semibold">How to use it in your routine</p>
                <p className="mt-1 text-sm leading-relaxed">{s.text}</p>
              </div>
            );
          }
          // benefits
          return (
            <div key={i}>
              <p className="text-base font-semibold">Benefits for your skin</p>
              <div className="mt-2 space-y-2">
                {s.items.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.title} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{b.title}</p>
                        <p className="text-xs text-muted-foreground">{b.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {article.products.length > 0 && (
        <div className="mt-6">
          <p className="text-base font-semibold">Best products with {article.title.split(":")[0]}</p>
          <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {article.products.map((p) => (
              <div key={p.name} className="min-w-[120px] rounded-2xl border border-border/70 bg-card p-3 text-center">
                <div className="mb-2 flex h-16 items-center justify-center rounded-xl bg-primary/5 text-2xl">🧴</div>
                <p className="text-xs font-semibold leading-tight">{p.name}</p>
                <p className="mt-1 text-xs font-semibold text-primary">{p.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3">
        <p className="text-xs font-medium">Was this helpful?</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHelpful("yes")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border ${helpful === "yes" ? "border-sage bg-sage/15 text-sage" : "border-border text-muted-foreground"}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setHelpful("no")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border ${helpful === "no" ? "border-coral bg-coral/15 text-coral" : "border-border text-muted-foreground"}`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Button size="lg" className="mt-3 h-12 w-full rounded-2xl">
        <Share2 className="mr-1 h-4 w-4" /> Share Article
      </Button>
    </DeviceFrame>
  );
}
