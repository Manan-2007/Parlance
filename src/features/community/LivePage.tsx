/**
 * "Here, together": the live room of a meetup. Everyone in the same place
 * joins with the host's six-digit code (or QR code) and sees one shared wall
 * of big messages, written by typing, speaking or signing. The room and its
 * messages end when the meetup ends.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Radio, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { QrCode } from "@/components/ui/QrCode";
import { announce } from "@/components/ui/Toaster";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatCode, LIMITS, normaliseCode, type LiveMessage, type LiveRoom, type PostInput } from "@/community/model";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/cn";
import { communityApi } from "@/services/community/api";
import { useCommunityEvents } from "@/services/community/useCommunityEvents";
import { useCommunity } from "@/stores/community";
import { LiveCodeBox } from "./CommunityPage";
import { AuthorLine, errorMessage, JoinForm, OfflineNotice, PostBox, SeeAndHear, useMinuteTick } from "./parts";

const QUICK = ["Hello!", "Nice to meet you", "Can you sign that again, slowly?", "Where are you sitting?", "Thank you", "I need a break"];

export function LivePage() {
  const { code: raw } = useParams();
  const code = raw ? normaliseCode(raw) : null;
  useDocumentTitle(code ? "Live meetup · Community" : "Join a live meetup · Community");
  if (!code) return <JoinByCode invalid={!!raw} />;
  return <Room key={code} code={code} />;
}

function JoinByCode({ invalid }: { invalid: boolean }) {
  return (
    <div className="container-app max-w-xl py-8 sm:py-12">
      <Link to="/app/community" className="inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Community
      </Link>
      <h1 className="mt-4 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[2.75rem]">Join a live meetup</h1>
      <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
        At a meetup, the host shows a QR code and a six-digit code. Everyone who is there joins the same live room and talks on one shared screen.
      </p>
      {invalid && <p role="alert" className="mt-4 font-semibold text-danger">That link does not have a valid code. Type the six digits instead.</p>}
      <div className="mt-6">
        <LiveCodeBox autoFocus />
      </div>
    </div>
  );
}

function Room({ code }: { code: string }) {
  useMinuteTick();
  const member = useCommunity((s) => s.member);
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [text, setText] = useState("");
  const [input, setInput] = useState<PostInput>("typed");
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const wall = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    communityApi
      .live(code, controller.signal)
      .then(({ room }) => {
        setRoom(room);
        setMessages(room.messages);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [code, member?.id]);

  const { presence, state } = useCommunityEvents(room && !ended ? `live:${code}` : null, (event) => {
    if (event.type === "live-message") {
      setMessages((list) => (list.some((m) => m.id === event.message.id) ? list : [...list.slice(-199), event.message]));
      if (event.message.author.id !== member?.id) announce(`${event.message.author.handle}: ${event.message.text}`);
    } else if (event.type === "live-ended") {
      setEnded(true);
      announce("The live room has ended.");
    }
  });

  // The room closes by itself at the end time.
  useEffect(() => {
    if (!room) return;
    const left = room.endsAt - Date.now();
    if (left <= 0) {
      setEnded(true);
      return;
    }
    const timer = window.setTimeout(() => setEnded(true), Math.min(left, 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [room]);

  useEffect(() => {
    const el = wall.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (message: string, how: PostInput) => {
    const clean = message.trim();
    if (!clean) return;
    setBusy(true);
    setSendError(null);
    try {
      const sent = await communityApi.sayLive(code, clean.slice(0, LIMITS.live.max), how);
      setMessages((list) => (list.some((m) => m.id === sent.id) ? list : [...list, sent]));
      setText("");
      setInput("typed");
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="container-app max-w-xl py-8 sm:py-12">
        <Link to="/app/community/live" className="inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Another code
        </Link>
        <div className="mt-6">
          <OfflineNotice error={error} />
        </div>
      </div>
    );
  }
  if (!room) {
    return <div className="container-app max-w-4xl py-8" aria-busy><div className="h-96 animate-pulse rounded-[2rem] bg-surface ring-1 ring-line" /></div>;
  }

  const joinUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/app/community/live/${code}`;
  const minutesLeft = Math.max(0, Math.round((room.endsAt - Date.now()) / 60_000));

  return (
    <div className="container-app max-w-5xl py-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/app/community/t/${room.threadId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Meetup details
          </Link>
          <p className="mt-3 flex flex-wrap items-center gap-2">
            {ended ? <Badge tone="neutral">Ended</Badge> : <Badge tone="danger" icon={<Radio aria-hidden />}>Live</Badge>}
            <Badge tone="voice">Here, together</Badge>
          </p>
          <h1 className="mt-2 text-[2rem] leading-[1.05] font-extrabold tracking-[-0.04em] text-navy sm:text-[2.5rem]">{room.title}</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem] font-semibold text-ink-2">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{room.place}, {room.city}</span>
            <span className="inline-flex items-center gap-1.5" aria-live="polite"><Users className="size-4" aria-hidden />{Math.max(1, presence)} here now</span>
            {!ended && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />Ends {formatTime(room.endsAt)}{minutesLeft <= 30 ? ` (${minutesLeft} min left)` : ""}</span>}
          </p>
        </div>
        <Button variant="secondary" size="sm" aria-expanded={showCode} onClick={() => setShowCode((v) => !v)}>
          {showCode ? "Hide code" : `Code ${formatCode(code)}`}
        </Button>
      </div>

      {showCode && (
        <div className="mt-4 flex flex-wrap items-center gap-5 rounded-[1.5rem] bg-surface p-4 ring-1 ring-line">
          <QrCode value={joinUrl} label={`QR code to join this live room, code ${formatCode(code)}`} className="size-40 shrink-0" />
          <div>
            <p className="text-sm font-bold text-ink-3">Someone next to you wants to join?</p>
            <p className="text-[3rem] leading-none font-extrabold tracking-[0.12em] text-navy">{formatCode(code)}</p>
            <p className="mt-2 text-sm text-ink-2">They scan the QR code, or open Community → Join a live meetup and type the code.</p>
          </div>
        </div>
      )}

      {state === "connecting" && !ended && <p className="mt-3 text-sm font-semibold text-ink-3" role="status">Reconnecting…</p>}

      <ol
        ref={wall}
        aria-label="Messages in this room"
        aria-live="polite"
        aria-relevant="additions"
        className="mt-5 grid max-h-[min(60svh,36rem)] min-h-[18rem] content-start gap-3 overflow-y-auto rounded-[2rem] bg-navy p-4 sm:p-6"
      >
        {messages.length === 0 && (
          <li className="m-auto max-w-sm py-10 text-center text-lg font-semibold text-white/80">
            Nobody has written yet. Say hello: type it, speak it, or add something you signed.
          </li>
        )}
        {messages.map((message) => {
          const mine = message.author.id === member?.id;
          return (
            <li key={message.id} className={cn("max-w-[42rem] rounded-[1.5rem] px-4 py-3 sm:px-5", mine ? "ml-auto bg-sun-400 text-navy" : "bg-surface text-navy")}>
              <AuthorLine author={message.author} at={message.createdAt} input={message.input} size="sm" />
              <p className="mt-1.5 text-[1.5rem] leading-snug font-extrabold tracking-[-0.02em] sm:text-[1.875rem]">{message.text}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <SeeAndHear text={message.text} />
              </div>
            </li>
          );
        })}
      </ol>

      {ended ? (
        <div className="mt-5 rounded-[1.5rem] bg-surface p-5 ring-1 ring-line">
          <p className="text-lg font-extrabold text-navy">This live room has ended.</p>
          <p className="mt-1 text-ink-2">Its messages are deleted. Keep talking in the meetup's thread.</p>
          <Link to={`/app/community/t/${room.threadId}`} className={cn(buttonClasses({ size: "sm" }), "mt-3")}>Go to the meetup thread</Link>
        </div>
      ) : member ? (
        <form
          className="mt-5 grid gap-3 rounded-[1.75rem] bg-surface p-4 ring-1 ring-line sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void send(text, input);
          }}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick messages">
            {QUICK.map((q) => (
              <Button key={q} type="button" size="sm" variant="subtle" disabled={busy} onClick={() => void send(q, "typed")}>{q}</Button>
            ))}
          </div>
          <PostBox value={text} onChange={setText} onInput={setInput} label="Your message" rows={2} max={LIMITS.live.max} placeholder="Short messages are easiest to read." />
          {sendError && <p role="alert" className="font-semibold text-danger">{sendError}</p>}
          <div>
            <Button type="submit" size="lg" variant="primary" disabled={busy || !text.trim()} leading={<Send aria-hidden />}>Send to the room</Button>
          </div>
        </form>
      ) : (
        <div className="mt-5">
          <JoinForm />
        </div>
      )}
    </div>
  );
}
