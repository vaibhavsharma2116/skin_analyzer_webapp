import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bookmark, Share2, ThumbsDown, ThumbsUp, UserCircle } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { getArticleBySlug } from "@/lib/articles.functions";
import type { ArticleSection } from "@/lib/tips-content";

export const Route = createFileRoute("/tips/article/$slug")({
  loader: async ({ params }) => {
    const fn = getArticleBySlug;
    const article = await fn({ data: params.slug });
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
  const data = Route.useLoaderData();
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
      <div className={`flex h-40 items-center justify-center rounded-[24px] bg-gradient-to-br ${article.metadata?.gradient || "from-primary/20 to-primary/5"} text-6xl`}>
        {article.metadata?.hero ?? "✨"}
      </div>

      <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        {article.category || "Article"}
      </span>
      <h1 className="mt-2 text-xl font-semibold leading-tight">{article.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>

      <div className="mt-4 flex items-center justify-between border-y border-border/50 py-3">
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          <span className="text-xs font-medium">{article.author}</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">{article.metadata?.readMinutes || 3} min read</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(article.published_at || article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-muted/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In this article</p>
        <ul className="mt-2 space-y-1.5">
          {(article.metadata?.toc || []).map((item: string, i: number) => (
            <li key={i} className="text-sm font-medium text-foreground/80">• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed">
        {(article.metadata?.sections || []).map((s: ArticleSection, i: number) => {
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
          return (
            <div key={i}>
              <p className="text-base font-semibold">Benefits for your skin</p>
              <div className="mt-2 space-y-2">
                {s.items.map((b: any) => {
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

      {(article.metadata?.products || []).length > 0 && (
        <div className="mt-10">
          <p className="text-sm font-semibold">Recommended for this routine</p>
          <div className="mt-3 space-y-2">
            {(article.metadata?.products || []).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs font-semibold text-primary">{p.price}</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="h-8 rounded-full text-xs">Shop</Button>
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
