import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronRight, MessageCircle, Share2, Star, ThumbsUp, UserCircle } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { ANSWERS, EXPERTS_BY_ID, type Expert, type ExpertAnswer } from "@/lib/tips-content";

export const Route = createFileRoute("/tips/experts/$id")({
  loader: ({ params }) => {
    const expert = EXPERTS_BY_ID[params.id];
    if (!expert) throw notFound();
    return { expert, answers: ANSWERS.filter((a) => a.expertId === params.id) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.expert.name} — SKIN POP` },
          { name: "description", content: `${loaderData.expert.title}. ${loaderData.expert.bio}` },
        ]
      : [{ title: "Expert — SKIN POP" }, { name: "robots", content: "noindex" }],
  }),
  component: ExpertProfilePage,
});

const TABS = ["Top Answers", "Recent Answers", "About"];

function ExpertProfilePage() {
  const data = Route.useLoaderData() as { expert: Expert; answers: ExpertAnswer[] };
  const { expert, answers } = data;
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [following, setFollowing] = useState(false);

  return (
    <DeviceFrame
      title={expert.name}
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips/experts" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Share"><Share2 className="h-4 w-4" /></button>}
    >
      <div className="rounded-[24px] border border-border/70 bg-card p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold ${expert.tone}`}>
            {expert.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{expert.name}</p>
            <p className="truncate text-xs text-muted-foreground">{expert.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">{expert.years}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {expert.rating} <span className="text-muted-foreground">({expert.answers} Answers)</span>
            </p>
          </div>
          <Button
            variant={following ? "outline" : "default"}
            size="sm"
            className="rounded-full"
            onClick={() => setFollowing((v) => !v)}
          >
            {following ? "Following" : "Follow"}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{expert.bio}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 rounded-2xl bg-secondary/40 py-2 text-center">
          <div><p className="text-sm font-bold">{expert.answers}</p><p className="text-[10px] text-muted-foreground">Answers</p></div>
          <div><p className="text-sm font-bold">{expert.followers}</p><p className="text-[10px] text-muted-foreground">Followers</p></div>
          <div><p className="text-sm font-bold">{expert.positive}</p><p className="text-[10px] text-muted-foreground">Positive Rating</p></div>
        </div>
      </div>

      <div className="mt-4 flex border-b border-border/70 text-sm">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`flex-1 border-b-2 py-2 text-xs font-semibold transition ${
              tab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 2 ? (
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4 text-sm leading-relaxed">
          <p className="font-semibold">About</p>
          <p className="mt-2 text-muted-foreground">{expert.bio}</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {answers.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
              No answers yet.
            </p>
          )}
          {answers.map((a) => (
            <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">{a.question}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.answer}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><UserCircle className="h-3.5 w-3.5" /> {expert.name}</span>
                  <span>·</span>
                  <span>{a.daysAgo}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {a.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {a.comments}</span>
                </div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      <Button size="lg" variant="outline" className="mt-5 h-12 w-full rounded-2xl border-primary/40 text-primary">
        Ask Your Question
      </Button>
    </DeviceFrame>
  );
}
