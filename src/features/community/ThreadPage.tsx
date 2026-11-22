import { useCallback, useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CircleCheck, Eye, MapPin, Pencil, Quote, Radio, Reply as ReplyIcon, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { QrCode } from "@/components/ui/QrCode";
import { announce, toast } from "@/components/ui/Toaster";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  applyThreadEvent, formatCode, KIND_LABEL, lengthProblem, LIMITS, meetupState,
  type PostInput, type Reply, type ThreadDetail,
} from "@/community/model";
import { cn } from "@/lib/cn";
import { communityApi } from "@/services/community/api";
import { useCommunityEvents } from "@/services/community/useCommunityEvents";
import { useCommunity } from "@/stores/community";
import {
  AuthorLine, errorMessage, formatMeetupTime, HelpfulButton, JoinForm, OfflineNotice, PostBox, ReportButton, SeeAndHear, SPACE_TITLE, SpaceChip, useMinuteTick,
} from "./parts";

export function ThreadPage() {
  useMinuteTick();
  const { threadId } = useParams();
  const id = Number(threadId);
  const navigate = useNavigate();
  const member = useCommunity((s) => s.member);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quote, setQuote] = useState<Reply | null>(null);
  useDocumentTitle(thread ? `${thread.title} · Community` : "Community");

  const load = useCallback(
    (signal?: AbortSignal) =>
      communityApi
        .thread(id, signal)
        .then(({ thread }) => {
          setThread(thread);
          setError(null);
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setError(errorMessage(e));
        }),
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
    // Reload when you join or leave, so "mine" and your helpful marks are right.
  }, [load, member?.id]);

  const { presence } = useCommunityEvents(Number.isFinite(id) && !error ? `thread:${id}` : null, (event) => {
    if (event.type === "reply" && event.reply.author.id !== member?.id) announce(`New reply from ${event.reply.author.handle}`);
    setThread((current) => {
      if (!current) return current;
      const next = applyThreadEvent(current, event);
      if (next === null) setGone(true);
      return next ?? current;
    });
  });

  if (error && !thread) {
    return (
      <div className="container-app max-w-3xl py-8 sm:py-12">
        <BackLink />
        <div className="mt-6">
          <OfflineNotice error={error} onRetry={() => void load()} />
        </div>
      </div>
    );
  }
  if (!thread) {
    return (
      <div className="container-app max-w-3xl py-8 sm:py-12" aria-busy>
        <BackLink />
        <div className="mt-6 h-64 animate-pulse rounded-[1.75rem] bg-surface ring-1 ring-line" />
      </div>
    );
  }

  const answer = thread.answerId !== null ? thread.replies.find((r) => r.id === thread.answerId) : undefined;
  const setHelpful = async (on: boolean) => {
    try {
      const { count } = await communityApi.helpful("thread", thread.id, on);
      setThread((t) => (t ? { ...t, helpful: count, myHelpful: on } : t));
    } catch (e) {
      toast(errorMessage(e), "warning");
    }
  };

  return (
    <div className="container-app max-w-3xl py-8 sm:py-12">
      <BackLink space={thread.space} />

      {gone && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 font-semibold text-danger">
          This post was removed by its author or hidden after reports.
        </p>
      )}

      <article aria-labelledby="thread-title" className="mt-4 rounded-[1.75rem] bg-surface p-5 ring-1 ring-line sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-3">
          <SpaceChip space={thread.space} className="size-8 [&_svg]:size-4" />
          <span>{SPACE_TITLE[thread.space]}</span>
          {thread.kind !== "discussion" && <Badge tone={thread.kind === "meetup" ? "voice" : "brand"}>{KIND_LABEL[thread.kind]}</Badge>}
          {answer && <Badge tone="success" icon={<CircleCheck aria-hidden />}>Answered</Badge>}
          {thread.hidden && <Badge tone="danger">Hidden after reports (only you can see it)</Badge>}
          <span className="ml-auto inline-flex items-center gap-1.5 font-semibold" aria-live="polite">
            <Eye className="size-4" aria-hidden /> {Math.max(1, presence)} reading now
          </span>
        </div>

        {editing ? (
          <EditThread thread={thread} onDone={(next) => { if (next) setThread({ ...thread, ...next, replies: thread.replies }); setEditing(false); }} />
        ) : (
          <>
            <h1 id="thread-title" className="mt-4 text-[1.875rem] leading-[1.1] font-extrabold tracking-[-0.04em] text-navy sm:text-[2.25rem]">
              {thread.title}
            </h1>
            <div className="mt-3">
              <AuthorLine author={thread.author} at={thread.createdAt} edited={thread.editedAt} input={thread.input} />
            </div>
            {thread.meetup && <MeetupPanel thread={thread} onChange={(next) => setThread({ ...thread, ...next, replies: thread.replies })} />}
            <p className="mt-5 text-[1.125rem] leading-8 whitespace-pre-wrap text-ink">{thread.body}</p>
          </>
        )}

        {!editing && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <SeeAndHear text={`${thread.title}. ${thread.body}`} />
            <HelpfulButton count={thread.helpful} on={thread.myHelpful} disabled={!member || thread.mine} onToggle={(on) => void setHelpful(on)} />
            {thread.mine ? (
              <>
                <Button size="sm" variant="ghost" leading={<Pencil aria-hidden />} onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant="ghost" leading={<Trash2 aria-hidden />} onClick={() => setDeleting(true)}>Delete</Button>
              </>
            ) : (
              member && <ReportButton target="thread" id={thread.id} onReported={(hidden) => hidden && setGone(true)} />
            )}
          </div>
        )}
      </article>

      {answer && (
        <a href={`#reply-${answer.id}`} className="mt-4 flex items-center gap-3 rounded-[1.5rem] bg-forest-50 px-5 py-4 text-forest-800 ring-1 ring-forest-200">
          <CircleCheck className="size-5 shrink-0" aria-hidden />
          <span className="font-semibold">{thread.author.handle} marked {answer.author.handle}'s reply as the answer. Go to it.</span>
        </a>
      )}

      <section aria-labelledby="replies-title" className="mt-8">
        <h2 id="replies-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">
          {thread.replies.length === 0 ? "No replies yet" : thread.replies.length === 1 ? "1 reply" : `${thread.replies.length} replies`}
        </h2>
        <ol className="mt-4 grid gap-3" aria-live="polite" aria-relevant="additions">
          {thread.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              quoted={reply.quoteId ? thread.replies.find((r) => r.id === reply.quoteId) : undefined}
              isAnswer={reply.id === thread.answerId}
              canAnswer={thread.mine && thread.kind === "question"}
              signedIn={!!member}
              onQuote={() => {
                setQuote(reply);
                document.getElementById("reply-box")?.focus();
              }}
              onChange={(next) => setThread((t) => (t ? { ...t, replies: t.replies.map((r) => (r.id === next.id ? next : r)) } : t))}
              onRemove={() => setThread((t) => (t ? { ...t, replies: t.replies.filter((r) => r.id !== reply.id), answerId: t.answerId === reply.id ? null : t.answerId } : t))}
              onAnswer={async (on) => {
                try {
                  const next = await communityApi.answer(thread.id, on ? reply.id : null);
                  setThread((t) => (t ? { ...t, answerId: next.answerId } : t));
                  toast(on ? "Marked as the answer." : "Answer removed.");
                } catch (e) {
                  toast(errorMessage(e), "warning");
                }
              }}
            />
          ))}
        </ol>
      </section>

      <section aria-labelledby="reply-title" className="mt-8">
        <h2 id="reply-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">Your reply</h2>
        <div className="mt-4">
          {member ? (
            <ReplyForm
              threadId={thread.id}
              quote={quote}
              onClearQuote={() => setQuote(null)}
              onPosted={(reply) => setThread((t) => (t ? applyThreadEvent(t, { type: "reply", reply }) ?? t : t))}
            />
          ) : (
            <JoinForm />
          )}
        </div>
      </section>

      <ConfirmDialog
        open={deleting}
        onCancel={() => setDeleting(false)}
        title="Delete this post?"
        description="The post and its replies disappear for everyone. This cannot be undone."
        confirmLabel="Delete post"
        onConfirm={async () => {
          setDeleting(false);
          try {
            await communityApi.deleteThread(thread.id);
            toast("Post deleted.");
            navigate(`/app/community/s/${thread.space}`, { replace: true });
          } catch (e) {
            toast(errorMessage(e), "warning");
          }
        }}
      />
    </div>
  );
}

function BackLink({ space }: { space?: ThreadDetail["space"] }) {
  return (
    <Link to={space ? `/app/community/s/${space}` : "/app/community"} className="inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline">
      <ArrowLeft className="size-4" aria-hidden /> {space ? SPACE_TITLE[space] : "Community"}
    </Link>
  );
}

function EditThread({ thread, onDone }: { thread: ThreadDetail; onDone: (next: Partial<ThreadDetail> | null) => void }) {
  const [title, setTitle] = useState(thread.title);
  const [body, setBody] = useState(thread.body);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  return (
    <form
      className="mt-4 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const problem = lengthProblem(title, LIMITS.title, "title") ?? (thread.kind === "meetup" ? null : lengthProblem(body, LIMITS.body, "post"));
        if (problem) return setError(problem);
        setBusy(true);
        try {
          onDone(await communityApi.editThread(thread.id, title.trim(), body.trim()));
          toast("Saved.");
        } catch (e) {
          setError(errorMessage(e));
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-1.5">
        <label htmlFor={titleId} className="text-[0.9375rem] font-semibold text-ink">Title</label>
        <input id={titleId} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.title.max} className="h-12 rounded-2xl border-2 border-line bg-surface px-4 text-[1.0625rem] font-semibold text-ink" />
      </div>
      <PostBox value={body} onChange={setBody} onInput={() => undefined} label="Post" rows={8} max={LIMITS.body.max} />
      {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        <Button variant="ghost" onClick={() => onDone(null)}>Cancel</Button>
      </div>
    </form>
  );
}

/** When and where, who is going, and the live room for the host. */
function MeetupPanel({ thread, onChange }: { thread: ThreadDetail; onChange: (next: Partial<ThreadDetail>) => void }) {
  const member = useCommunity((s) => s.member);
  const meetup = thread.meetup!;
  const state = meetupState(meetup);
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const joinUrl = meetup.code ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/app/community/live/${meetup.code}` : "";

  const run = async (action: () => Promise<Partial<ThreadDetail> | void>) => {
    setBusy(true);
    try {
      const next = await action();
      if (next) onChange(next);
    } catch (e) {
      toast(errorMessage(e), "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 grid gap-4 rounded-[1.5rem] bg-tangerine-50 p-4 ring-1 ring-tangerine-200 sm:p-5">
      <div className="grid gap-2 text-[1.0625rem] font-semibold text-navy">
        <p className="flex items-center gap-2"><CalendarDays className="size-5 shrink-0" aria-hidden />{formatMeetupTime(meetup.startsAt, meetup.endsAt)}</p>
        <p className="flex items-center gap-2"><MapPin className="size-5 shrink-0" aria-hidden />{meetup.place}, {meetup.city}</p>
        <p className="flex items-center gap-2"><Users className="size-5 shrink-0" aria-hidden />{meetup.going} going</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {state === "ended" ? (
          <Badge tone="neutral">This meetup has ended</Badge>
        ) : (
          member && !thread.mine && (
            <Button size="sm" variant={meetup.imGoing ? "dark" : "secondary"} aria-pressed={meetup.imGoing} disabled={busy}
              onClick={() => void run(() => communityApi.going(thread.id, !meetup.imGoing))}>
              {meetup.imGoing ? "You're going" : "I'm going"}
            </Button>
          )
        )}
        {meetup.live && !thread.mine && (
          <Link to="/app/community/live" className={buttonClasses({ size: "sm", variant: "voice" })}>
            <Radio className="size-4" aria-hidden /> Live now: enter the host's code
          </Link>
        )}
      </div>

      {thread.mine && state !== "ended" && (
        <div className="rounded-[1.25rem] bg-surface p-4 ring-1 ring-line">
          {meetup.live && meetup.code ? (
            <div className="flex flex-wrap items-center gap-5">
              <QrCode value={joinUrl} label={`QR code to join the live room, code ${formatCode(meetup.code)}`} className="size-36 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-3">Live room code</p>
                <p className="text-[2.5rem] leading-none font-extrabold tracking-[0.12em] text-navy">{formatCode(meetup.code)}</p>
                <p className="mt-2 text-sm text-ink-2">Show this at the meetup. People scan it or type the code. Messages are deleted when the meetup ends.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/app/community/live/${meetup.code}`} className={buttonClasses({ size: "sm", variant: "voice" })}>
                    <Radio className="size-4" aria-hidden /> Open live room
                  </Link>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEnding(true)}>End live room</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.9375rem] text-ink-2">
                {state === "upcoming"
                  ? "You can open the live room from an hour before the start."
                  : "When people arrive, open the live room. Everyone there joins with your code and talks in one place."}
              </p>
              <Button size="sm" variant="voice" disabled={busy || state === "upcoming"} leading={<Radio aria-hidden />}
                onClick={() => void run(() => communityApi.startLive(thread.id))}>
                Open live room
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={ending}
        onCancel={() => setEnding(false)}
        title="End the live room?"
        description="Everyone in it is told the room has ended, and its messages are deleted."
        confirmLabel="End live room"
        onConfirm={() => void run(async () => {
          setEnding(false);
          await communityApi.endLive(thread.id);
          return { meetup: { ...meetup, live: false, code: null } };
        })}
      />
    </div>
  );
}

function ReplyItem({
  reply, quoted, isAnswer, canAnswer, signedIn, onQuote, onChange, onRemove, onAnswer,
}: {
  reply: Reply;
  quoted?: Reply;
  isAnswer: boolean;
  canAnswer: boolean;
  signedIn: boolean;
  onQuote: () => void;
  onChange: (reply: Reply) => void;
  onRemove: () => void;
  onAnswer: (on: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(reply.body);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <li id={`reply-${reply.id}`} className={cn("scroll-mt-24 rounded-[1.5rem] bg-surface p-4 ring-1 sm:p-5", isAnswer ? "ring-2 ring-forest-400" : "ring-line")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AuthorLine author={reply.author} at={reply.createdAt} edited={reply.editedAt} input={reply.input} size="sm" />
        {isAnswer && <Badge tone="success" icon={<CircleCheck aria-hidden />}>Answer</Badge>}
      </div>
      {quoted && (
        <blockquote className="mt-3 rounded-2xl border-l-4 border-cobalt-300 bg-paper-2 px-4 py-2 text-sm text-ink-2">
          <span className="font-bold text-navy">{quoted.author.handle}:</span> <span className="line-clamp-2">{quoted.body}</span>
        </blockquote>
      )}
      {editing ? (
        <form
          className="mt-3 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const problem = lengthProblem(body, LIMITS.reply, "reply");
            if (problem) return setError(problem);
            try {
              onChange(await communityApi.editReply(reply.id, body.trim()));
              setEditing(false);
              setError(null);
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          <PostBox value={body} onChange={setBody} onInput={() => undefined} label="Edit your reply" rows={4} max={LIMITS.reply.max} />
          {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm">Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBody(reply.body); }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-[1.0625rem] leading-7 whitespace-pre-wrap text-ink">{reply.body}</p>
      )}
      {!editing && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <SeeAndHear text={reply.body} />
          <HelpfulButton
            count={reply.helpful}
            on={reply.myHelpful}
            disabled={!signedIn || reply.mine}
            onToggle={async (on) => {
              try {
                const { count } = await communityApi.helpful("reply", reply.id, on);
                onChange({ ...reply, helpful: count, myHelpful: on });
              } catch (e) {
                toast(errorMessage(e), "warning");
              }
            }}
          />
          {signedIn && <Button size="sm" variant="ghost" leading={<Quote aria-hidden />} onClick={onQuote}>Reply to this</Button>}
          {canAnswer && !reply.mine && (
            <Button size="sm" variant={isAnswer ? "dark" : "ghost"} aria-pressed={isAnswer} leading={<CircleCheck aria-hidden />} onClick={() => onAnswer(!isAnswer)}>
              {isAnswer ? "The answer" : "Mark as answer"}
            </Button>
          )}
          {reply.mine ? (
            <>
              <Button size="sm" variant="ghost" leading={<Pencil aria-hidden />} onClick={() => setEditing(true)}>Edit</Button>
              <Button size="sm" variant="ghost" leading={<Trash2 aria-hidden />} onClick={() => setDeleting(true)}>Delete</Button>
            </>
          ) : (
            signedIn && <ReportButton target="reply" id={reply.id} onReported={(hidden) => hidden && onRemove()} />
          )}
        </div>
      )}
      <ConfirmDialog
        open={deleting}
        onCancel={() => setDeleting(false)}
        title="Delete this reply?"
        description="It disappears for everyone. This cannot be undone."
        confirmLabel="Delete reply"
        onConfirm={async () => {
          setDeleting(false);
          try {
            await communityApi.deleteReply(reply.id);
            onRemove();
          } catch (e) {
            toast(errorMessage(e), "warning");
          }
        }}
      />
    </li>
  );
}

function ReplyForm({ threadId, quote, onClearQuote, onPosted }: { threadId: number; quote: Reply | null; onClearQuote: () => void; onPosted: (reply: Reply) => void }) {
  const [body, setBody] = useState("");
  const [input, setInput] = useState<PostInput>("typed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 rounded-[1.75rem] bg-surface p-5 ring-1 ring-line"
      onSubmit={async (event) => {
        event.preventDefault();
        const problem = lengthProblem(body, LIMITS.reply, "reply");
        if (problem) return setError(problem);
        setBusy(true);
        setError(null);
        try {
          onPosted(await communityApi.reply(threadId, body.trim(), input, quote?.id ?? null));
          setBody("");
          setInput("typed");
          onClearQuote();
          announce("Reply posted.");
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {quote && (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-paper-2 px-4 py-2 text-sm text-ink-2">
          <span className="line-clamp-2"><ReplyIcon className="mr-1 inline size-4" aria-hidden /> Replying to <span className="font-bold text-navy">{quote.author.handle}</span>: {quote.body}</span>
          <Button size="sm" variant="ghost" onClick={onClearQuote}>Cancel</Button>
        </div>
      )}
      <PostBox id="reply-box" value={body} onChange={setBody} onInput={setInput} label="Write a reply" rows={4} max={LIMITS.reply.max} placeholder="Share what worked for you." />
      {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
      <div>
        <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post reply"}</Button>
      </div>
    </form>
  );
}
