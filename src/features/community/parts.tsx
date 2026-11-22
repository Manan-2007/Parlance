/**
 * Pieces shared by the Community pages: space styling, author lines, thread
 * cards, joining, the post box (type, speak, or add something you signed),
 * and the per-post actions (see it in sign, read aloud, helpful, report).
 */
import { lazy, Suspense, useEffect, useId, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Briefcase, CalendarDays, CircleCheck, Flag, Hand, HandHeart, HeartPulse, MapPin, MessageCircleQuestion, MessagesSquare, Mic,
  Scale, ShoppingBag, Smartphone, Square, ThumbsUp, Users, Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Notice } from "@/components/ui/Status";
import { toast } from "@/components/ui/Toaster";
import {
  handleProblem, INPUT_LABEL, KIND_LABEL, LIMITS, REPORT_REASONS, timeAgo, WAY_LABEL, WAYS,
  type Member, type PostInput, type ReportReason, type SpaceId, type Thread, type Way,
} from "@/community/model";
import { cn } from "@/lib/cn";
import { CommunityApiError, communityApi } from "@/services/community/api";
import { SPEECH_ERROR_MESSAGES, useSpeechInput } from "@/services/speech/useSpeechInput";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useCommunity } from "@/stores/community";
import { useHistory } from "@/stores/history";
import { useSettings } from "@/stores/settings";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export const SPACE_STYLE: Record<SpaceId, { icon: Icon; chip: string }> = {
  everyday: { icon: ShoppingBag, chip: "bg-sun-400 text-navy" },
  work: { icon: Briefcase, chip: "bg-cobalt-400 text-white" },
  study: { icon: BookOpen, chip: "bg-forest-400 text-white" },
  health: { icon: HeartPulse, chip: "bg-tangerine-400 text-navy" },
  rights: { icon: Scale, chip: "bg-navy text-white" },
  family: { icon: Users, chip: "bg-sun-400 text-navy" },
  "learn-isl": { icon: HandHeart, chip: "bg-forest-400 text-white" },
  tech: { icon: Smartphone, chip: "bg-cobalt-400 text-white" },
  meetups: { icon: MapPin, chip: "bg-tangerine-400 text-navy" },
};

export const SPACE_TITLE: Record<SpaceId, string> = {
  everyday: "Everyday life",
  work: "Work and jobs",
  study: "Study and exams",
  health: "Health",
  rights: "Rights and documents",
  family: "Family and friends",
  "learn-isl": "Learning ISL",
  tech: "Tech and tools",
  meetups: "Meetups",
};

export function SpaceChip({ space, className }: { space: SpaceId; className?: string }) {
  const { icon: SpaceIcon, chip } = SPACE_STYLE[space];
  return (
    <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", chip, className)} aria-hidden>
      <SpaceIcon className="size-5" aria-hidden />
    </span>
  );
}

const dateTime = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const timeOnly = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

export function formatMeetupTime(startsAt: number, endsAt: number): string {
  return `${dateTime.format(startsAt)} – ${timeOnly.format(endsAt)}`;
}

function initials(handle: string) {
  return [...handle.trim()][0]?.toUpperCase() ?? "?";
}

/** Who wrote it, how they communicate, when, and how it was written. */
export function AuthorLine({ author, at, edited, input, size = "md" }: { author: Member; at: number; edited?: number | null; input?: PostInput; size?: "sm" | "md" }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-cobalt-100 font-extrabold text-cobalt-800",
          size === "sm" ? "size-7 text-xs" : "size-9 text-sm",
        )}
      >
        {initials(author.handle)}
      </span>
      <span className="font-extrabold text-navy">{author.handle}</span>
      {author.city && <span>{author.city}</span>}
      {author.ways.slice(0, 2).map((way) => (
        <Badge key={way} tone={way === "deaf" || way === "hard-of-hearing" || way === "deafblind" ? "hands" : "neutral"}>
          {WAY_LABEL[way]}
        </Badge>
      ))}
      {author.sample && (
        <Badge tone="gold" title="Written by Parlance as an example, not by a real person">
          Sample
        </Badge>
      )}
      <span aria-hidden>·</span>
      <time dateTime={new Date(at).toISOString()}>{timeAgo(at)}</time>
      {edited ? <span>(edited)</span> : null}
      {input && input !== "typed" && (
        <Badge tone={input === "signed" ? "hands" : "voice"} icon={input === "signed" ? <Hand aria-hidden /> : <Mic aria-hidden />}>
          {INPUT_LABEL[input]}
        </Badge>
      )}
    </div>
  );
}

export function ThreadCard({ thread }: { thread: Thread }) {
  const titleId = useId();
  return (
    <article aria-labelledby={titleId} className="relative rounded-[1.5rem] bg-surface p-4 ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-navy hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <SpaceChip space={thread.space} className="mt-0.5 hidden sm:inline-flex" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-3">
            <span>{SPACE_TITLE[thread.space]}</span>
            {thread.kind !== "discussion" && <Badge tone={thread.kind === "meetup" ? "voice" : "brand"}>{KIND_LABEL[thread.kind]}</Badge>}
            {thread.kind === "question" && thread.answerId !== null && (
              <Badge tone="success" icon={<CircleCheck aria-hidden />}>
                Answered
              </Badge>
            )}
            {thread.meetup?.live && <Badge tone="danger">Live now</Badge>}
          </div>
          <h3 id={titleId} className="mt-1.5 text-lg leading-6 font-extrabold tracking-[-0.02em] text-navy">
            <Link to={`/app/community/t/${thread.id}`} className="after:absolute after:inset-0 after:rounded-[1.5rem] focus:outline-none">
              {thread.title}
            </Link>
          </h3>
          {thread.meetup ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-ink-2">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-ink-3" aria-hidden />{formatMeetupTime(thread.meetup.startsAt, thread.meetup.endsAt)}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-ink-3" aria-hidden />{thread.meetup.place}, {thread.meetup.city}</span>
            </p>
          ) : (
            <p className="mt-1 line-clamp-2 text-[0.9375rem] leading-6 text-ink-2">{thread.body}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <AuthorLine author={thread.author} at={thread.createdAt} size="sm" />
            <p className="flex items-center gap-3 text-sm font-semibold text-ink-3">
              <span className="inline-flex items-center gap-1"><MessagesSquare className="size-4" aria-hidden />{thread.replyCount}<span className="sr-only"> replies</span></span>
              <span className="inline-flex items-center gap-1"><ThumbsUp className="size-4" aria-hidden />{thread.helpful}<span className="sr-only"> found it helpful</span></span>
              {thread.meetup && <span className="inline-flex items-center gap-1"><Users className="size-4" aria-hidden />{thread.meetup.going}<span className="sr-only"> going</span></span>}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OfflineNotice({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Notice
      tone="warning"
      title="Community is not available right now"
      action={onRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button> : undefined}
    >
      {error}
    </Notice>
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof CommunityApiError) return error.message;
  return "Something went wrong. Try again.";
}

/** Choose a name to post with. Reading never needs this. */
export function JoinForm({ onJoined, compact = false, stacked = false }: { onJoined?: (member: Member) => void; compact?: boolean; stacked?: boolean }) {
  const setSession = useCommunity((s) => s.setSession);
  const [handle, setHandle] = useState("");
  const [city, setCity] = useState("");
  const [ways, setWays] = useState<Way[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleId = useId();
  const cityId = useId();
  const hintId = useId();

  const submit = async () => {
    const problem = handleProblem(handle);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { member, token } = await communityApi.join(handle.trim(), city.trim(), ways);
      setSession(member, token);
      toast(`Welcome, ${member.handle}.`);
      onJoined?.(member);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={cn("grid gap-4", !compact && "rounded-[1.75rem] bg-surface p-5 ring-1 ring-line sm:p-6")}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {!compact && (
        <div>
          <h2 className="text-xl font-extrabold tracking-[-0.025em] text-navy">Join to post and reply</h2>
          <p className="mt-1 text-[0.9375rem] leading-6 text-ink-2">
            Pick a name people will see. It does not need to be your real name. Reading is open to everyone.
          </p>
        </div>
      )}
      <div className={cn("grid gap-4", !stacked && "sm:grid-cols-2")}>
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor={handleId} className="text-[0.9375rem] font-semibold text-ink">Your community name</label>
          <input
            id={handleId}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={LIMITS.handle.max}
            autoComplete="nickname"
            aria-describedby={hintId}
            aria-invalid={error ? true : undefined}
            className="h-11 w-full min-w-0 rounded-2xl border-2 border-line bg-surface px-4 font-semibold text-ink hover:border-navy/50"
            placeholder="For example: Asha_signs"
          />
          <p id={hintId} className="text-sm text-ink-3">3 to 24 letters or numbers. Hindi works too.</p>
        </div>
        <div className="grid min-w-0 content-start gap-1.5">
          <label htmlFor={cityId} className="text-[0.9375rem] font-semibold text-ink">City <span className="font-normal text-ink-3">(optional)</span></label>
          <input
            id={cityId}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={LIMITS.city.max}
            autoComplete="address-level2"
            className="h-11 w-full min-w-0 rounded-2xl border-2 border-line bg-surface px-4 font-semibold text-ink hover:border-navy/50"
            placeholder="Helps find meetups near you"
          />
        </div>
      </div>
      <fieldset className="min-w-0">
        <legend className="text-[0.9375rem] font-semibold text-ink">How do you describe yourself? <span className="font-normal text-ink-3">(optional, choose any)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WAYS.map((way) => {
            const on = ways.includes(way.id);
            return (
              <button
                key={way.id}
                type="button"
                aria-pressed={on}
                onClick={() => setWays(on ? ways.filter((w) => w !== way.id) : [...ways, way.id])}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold ring-2 transition-colors",
                  on ? "bg-navy text-white ring-navy" : "bg-surface text-navy ring-line hover:ring-navy/50",
                )}
              >
                {on && <CircleCheck className="size-4" aria-hidden />}
                {way.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-[0.9375rem] font-semibold text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Joining…" : "Join the community"}
        </Button>
        <p className="text-sm text-ink-3">Your name is saved in this browser only. Do not share medical or contact details in posts.</p>
      </div>
    </form>
  );
}

/** What was signed recently on Sign → Text, to add to a post. */
function SignedPicker({ onPick }: { onPick: (text: string) => void }) {
  const signed = useHistory((s) => s.entries).filter((e) => e.direction === "sign-to-text").slice(0, 5);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="hands" leading={<Hand aria-hidden />} onClick={() => setOpen(true)}>
        Add what I signed
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add what you signed"
        description="Sign to the camera on Sign → Text, then come back and add the sentence here."
        footer={
          <Link to="/app/sign-to-text" className="inline-flex h-10 items-center rounded-full bg-forest-400 px-4 text-sm font-bold text-white">
            Open Sign → Text
          </Link>
        }
      >
        {signed.length === 0 ? (
          <p className="text-[0.9375rem] text-ink-2">Nothing signed yet in this browser (or history is turned off in Settings).</p>
        ) : (
          <ul className="grid gap-2">
            {signed.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-paper-2 px-4 py-3 text-left text-[0.9375rem] font-semibold text-navy hover:bg-cobalt-100"
                  onClick={() => {
                    onPick(entry.text);
                    setOpen(false);
                  }}
                >
                  {entry.text}
                  <span className="mt-0.5 block text-xs font-medium text-ink-3">{timeAgo(entry.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}

/**
 * A text box you can type into, speak into, or fill with a sentence you
 * signed. `input` says how most of it was written, shown on the post.
 */
export function PostBox({
  value,
  onChange,
  onInput,
  label,
  placeholder,
  rows = 5,
  max,
  id,
  describedBy,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onInput: (input: PostInput) => void;
  label: string;
  placeholder?: string;
  rows?: number;
  max: number;
  id?: string;
  describedBy?: string;
  autoFocus?: boolean;
}) {
  const language = useSettings((s) => s.speechLanguage);
  const fallbackId = useId();
  const boxId = id ?? fallbackId;
  const append = (text: string) => {
    const next = value.trim() ? `${value.trimEnd()} ${text}` : text;
    onChange(next.slice(0, max));
  };
  const speech = useSpeechInput(language, (text) => {
    append(text);
    onInput("spoken");
  });
  const listening = speech.status === "listening" || speech.status === "starting";

  return (
    <div className="grid gap-2">
      <label htmlFor={boxId} className="text-[0.9375rem] font-semibold text-ink">{label}</label>
      <textarea
        id={boxId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={max}
        placeholder={placeholder}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        className="w-full resize-y rounded-[1.25rem] border-2 border-line bg-surface px-4 py-3 text-[1.0625rem] leading-7 text-ink hover:border-navy/50"
      />
      {listening && speech.interim && <p className="text-sm text-ink-3" aria-live="polite">Hearing: {speech.interim}</p>}
      {speech.error && <p role="alert" className="text-sm font-semibold text-danger">{SPEECH_ERROR_MESSAGES[speech.error]}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {speech.supported && (
          <Button
            type="button"
            size="sm"
            variant="voice"
            aria-pressed={listening}
            leading={listening ? <Square aria-hidden /> : <Mic aria-hidden />}
            onClick={() => (listening ? speech.stop() : speech.start())}
          >
            {listening ? "Stop" : "Speak"}
          </Button>
        )}
        <SignedPicker
          onPick={(text) => {
            append(text);
            onInput("signed");
          }}
        />
        <span className="ml-auto text-xs text-ink-3" aria-hidden>{value.length}/{max}</span>
      </div>
    </div>
  );
}

const SignReply = lazy(() => import("@/features/cards/SignReply"));

/** "See it in sign" (the 3D signer, approximate) and "Read aloud". */
export function SeeAndHear({ text, size = "sm" }: { text: string; size?: "sm" | "md" }) {
  const [signing, setSigning] = useState(false);
  const speech = useSpeechOutput();
  return (
    <>
      <Button type="button" size={size} variant="subtle" leading={<Hand aria-hidden />} onClick={() => setSigning(true)}>
        See in sign
      </Button>
      {speech.supported && (
        <Button
          type="button"
          size={size}
          variant="subtle"
          leading={<Volume2 aria-hidden />}
          onClick={() => (speech.speaking ? speech.cancel() : speech.speak(text))}
        >
          {speech.speaking ? "Stop reading" : "Read aloud"}
        </Button>
      )}
      <Dialog open={signing} onClose={() => setSigning(false)} title="In sign" description="The 3D signer's signs are approximate. Words without a sign are fingerspelled.">
        {signing && (
          <div className="pb-5">
            <Suspense fallback={<p className="py-10 text-center text-ink-3">Loading the signer…</p>}>
              <SignReply text={text.slice(0, 600)} />
            </Suspense>
          </div>
        )}
      </Dialog>
    </>
  );
}

export function HelpfulButton({ count, on, disabled, onToggle }: { count: number; on: boolean; disabled?: boolean; onToggle: (on: boolean) => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={on ? "dark" : "subtle"}
      aria-pressed={on}
      disabled={disabled}
      leading={<ThumbsUp aria-hidden />}
      onClick={() => onToggle(!on)}
      title={disabled ? "You cannot mark your own post" : undefined}
    >
      Helpful{count ? ` · ${count}` : ""}
    </Button>
  );
}

export function ReportButton({ target, id, onReported }: { target: "thread" | "reply"; id: number; onReported?: (hidden: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [busy, setBusy] = useState(false);
  const name = useId();
  const send = async () => {
    setBusy(true);
    try {
      const result = await communityApi.report(target, id, reason);
      toast(result.hidden ? "Thank you. It is now hidden." : "Thank you. It is hidden once a few people report it.");
      setOpen(false);
      onReported?.(result.hidden);
    } catch (e) {
      toast(errorMessage(e), "warning");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button type="button" size="sm" variant="ghost" leading={<Flag aria-hidden />} onClick={() => setOpen(true)}>
        Report
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Report this ${target === "thread" ? "post" : "reply"}`}
        description="Reports are anonymous. A post is hidden for everyone once several people report it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={busy} onClick={() => void send()}>{busy ? "Sending…" : "Report"}</Button>
          </>
        }
      >
        <fieldset className="grid min-w-0 gap-2">
          <legend className="sr-only">Why are you reporting it?</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className="flex items-center gap-3 rounded-2xl bg-paper-2 px-4 py-3 text-[0.9375rem] font-semibold text-navy has-[:checked]:ring-2 has-[:checked]:ring-navy">
              <input type="radio" name={name} value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="size-4 accent-navy" />
              {r.label}
            </label>
          ))}
        </fieldset>
      </Dialog>
    </>
  );
}

export function SectionTitle({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id={id} className="text-xl font-extrabold tracking-[-0.025em] text-navy">{children}</h2>
      {action}
    </div>
  );
}

/** Re-renders every minute so "5 min ago" and meetup states stay current. */
export function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);
}

export { MessageCircleQuestion };
