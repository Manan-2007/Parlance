/**
 * Community: types shared with the local service (backend/community.py) and
 * the pure helpers the pages use. No React and no fetch here, so node tests
 * can load it directly.
 */

export type SpaceId =
  | "everyday" | "work" | "study" | "health" | "rights" | "family" | "learn-isl" | "tech" | "meetups";
export type ThreadKind = "discussion" | "question" | "meetup";
export type PostInput = "typed" | "spoken" | "signed";
export type Way = "deaf" | "hard-of-hearing" | "deafblind" | "family" | "learning" | "interpreter" | "teacher";
export type ReportReason = "spam" | "rude" | "unsafe" | "private" | "other";
export type ThreadSort = "active" | "new" | "unanswered" | "meetups";

export interface Member {
  id: number;
  handle: string;
  city: string;
  ways: Way[];
  /** Written by Parlance as an example, not by a real person. */
  sample: boolean;
  joinedAt: number;
}

export interface Space {
  id: SpaceId;
  title: string;
  description: string;
  threads: number;
  lastActivityAt: number | null;
}

export interface Meetup {
  place: string;
  city: string;
  startsAt: number;
  endsAt: number;
  going: number;
  imGoing: boolean;
  live: boolean;
  /** The live room's code. Only the host receives it, to show at the venue. */
  code: string | null;
}

export interface Thread {
  id: number;
  space: SpaceId;
  kind: ThreadKind;
  title: string;
  body: string;
  input: PostInput;
  author: Member;
  createdAt: number;
  editedAt: number | null;
  lastActivityAt: number;
  replyCount: number;
  helpful: number;
  myHelpful: boolean;
  answerId: number | null;
  hidden: boolean;
  mine: boolean;
  meetup: Meetup | null;
}

export interface Reply {
  id: number;
  threadId: number;
  body: string;
  input: PostInput;
  quoteId: number | null;
  author: Member;
  createdAt: number;
  editedAt: number | null;
  helpful: number;
  myHelpful: boolean;
  mine: boolean;
}

export interface ThreadDetail extends Thread {
  replies: Reply[];
}

export interface LiveMessage {
  id: number;
  text: string;
  input: PostInput;
  author: Member;
  createdAt: number;
}

export interface LiveRoom {
  code: string;
  threadId: number;
  title: string;
  place: string;
  city: string;
  startsAt: number;
  endsAt: number;
  host: Member;
  isHost: boolean;
  messages: LiveMessage[];
}

/** Server-sent events, by channel (feed, thread:<id>, live:<code>). */
export type CommunityEvent =
  | { type: "presence"; count: number }
  | { type: "thread-new"; thread: Thread }
  | { type: "activity"; threadId: number }
  | { type: "thread-updated"; thread: Thread }
  | { type: "thread-removed"; threadId: number }
  | { type: "reply"; reply: Reply }
  | { type: "reply-updated"; reply: Reply }
  | { type: "reply-removed"; id: number }
  | { type: "helpful"; target: "thread" | "reply"; id: number; count: number }
  | { type: "live-message"; message: LiveMessage }
  | { type: "live-ended" };

export const WAYS: { id: Way; label: string }[] = [
  { id: "deaf", label: "Deaf" },
  { id: "hard-of-hearing", label: "Hard of hearing" },
  { id: "deafblind", label: "DeafBlind" },
  { id: "family", label: "Family or CODA" },
  { id: "learning", label: "Learning ISL" },
  { id: "interpreter", label: "Interpreter" },
  { id: "teacher", label: "Teacher" },
];

export const WAY_LABEL = Object.fromEntries(WAYS.map((w) => [w.id, w.label])) as Record<Way, string>;

export const KIND_LABEL: Record<ThreadKind, string> = {
  discussion: "Discussion",
  question: "Question",
  meetup: "Meetup",
};

export const INPUT_LABEL: Record<PostInput, string> = {
  typed: "Typed",
  spoken: "Spoken",
  signed: "Signed",
};

export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam or advertising" },
  { id: "rude", label: "Rude or hateful" },
  { id: "unsafe", label: "Unsafe or harmful advice" },
  { id: "private", label: "Shares someone's private details" },
  { id: "other", label: "Something else" },
];

/** The same limits the service enforces, so the form can say so first. */
export const LIMITS = {
  handle: { min: 3, max: 24 },
  title: { min: 4, max: 120 },
  body: { min: 10, max: 4000 },
  reply: { min: 1, max: 2000 },
  live: { min: 1, max: 280 },
  place: { min: 2, max: 80 },
  city: { min: 2, max: 40 },
} as const;

// Letters in any script, including Devanagari vowel signs (\p{M}), digits, and _ . - or spaces inside.
const HANDLE = /^[\p{L}\p{N}_][\p{L}\p{M}\p{N}_ .-]{1,22}[\p{L}\p{M}\p{N}_]$/u;

/** A reason the name cannot be used, or null when it is fine. */
export function handleProblem(handle: string): string | null {
  const name = handle.trim().replace(/\s+/g, " ");
  if (name.length < LIMITS.handle.min) return `Use at least ${LIMITS.handle.min} characters.`;
  if (name.length > LIMITS.handle.max) return `Use at most ${LIMITS.handle.max} characters.`;
  if (!HANDLE.test(name)) return "Use letters, numbers, spaces, dots, dashes or underscores.";
  return null;
}

/** A reason the text cannot be posted yet, or null. */
export function lengthProblem(text: string, limit: { min: number; max: number }, what: string): string | null {
  const length = text.trim().length;
  if (length < limit.min) return limit.min === 1 ? `Write your ${what} first.` : `Write at least ${limit.min} characters in the ${what}.`;
  if (length > limit.max) return `Keep the ${what} under ${limit.max} characters (now ${length}).`;
  return null;
}

export type MeetupState = "upcoming" | "soon" | "now" | "ended";

/** "soon" is the hour before the start, when the host can already open the live room. */
export function meetupState(meetup: Pick<Meetup, "startsAt" | "endsAt">, now = Date.now()): MeetupState {
  if (now >= meetup.endsAt) return "ended";
  if (now >= meetup.startsAt) return "now";
  if (now >= meetup.startsAt - 60 * 60 * 1000) return "soon";
  return "upcoming";
}

/** "123 456": easier to read out and type. Non-digits are ignored. */
export function formatCode(code: string): string {
  const digits = code.replace(/\D/g, "").slice(0, 6);
  return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
}

export function normaliseCode(code: string): string | null {
  const digits = code.replace(/\D/g, "");
  return digits.length === 6 ? digits : null;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5 min ago", "3 h ago", "2 days ago", or a date. */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? "yesterday" : `${days} days ago`;
  }
  return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Thread lists after a live event, newest activity first, without duplicates. */
export function upsertThread(list: readonly Thread[], thread: Thread, sort: ThreadSort): Thread[] {
  const rest = list.filter((t) => t.id !== thread.id);
  if (sort === "unanswered" && (thread.kind !== "question" || thread.answerId !== null)) return rest;
  if (sort === "meetups" && thread.kind !== "meetup") return rest;
  const next = [thread, ...rest];
  if (sort === "meetups") return next.sort((a, b) => (a.meetup?.startsAt ?? 0) - (b.meetup?.startsAt ?? 0));
  if (sort === "active") return next.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  return next.sort((a, b) => b.createdAt - a.createdAt);
}

/** Applies one live thread event to a loaded thread (null when it was removed). */
export function applyThreadEvent(thread: ThreadDetail, event: CommunityEvent): ThreadDetail | null {
  switch (event.type) {
    case "thread-updated": {
      // Keep this viewer's own flags; the broadcast copy is the public view.
      const { mine, myHelpful } = thread;
      const meetup = event.thread.meetup && thread.meetup
        ? { ...event.thread.meetup, code: thread.meetup.code, imGoing: thread.meetup.imGoing }
        : event.thread.meetup;
      return { ...thread, ...event.thread, mine, myHelpful, meetup, replies: thread.replies };
    }
    case "thread-removed":
      return null;
    case "reply":
      if (thread.replies.some((r) => r.id === event.reply.id)) return thread;
      return { ...thread, replies: [...thread.replies, event.reply], replyCount: thread.replyCount + 1, lastActivityAt: event.reply.createdAt };
    case "reply-updated":
      return {
        ...thread,
        replies: thread.replies.map((r) => (r.id === event.reply.id ? { ...event.reply, mine: r.mine, myHelpful: r.myHelpful } : r)),
      };
    case "reply-removed": {
      if (!thread.replies.some((r) => r.id === event.id)) return thread;
      return {
        ...thread,
        replies: thread.replies.filter((r) => r.id !== event.id),
        replyCount: Math.max(0, thread.replyCount - 1),
        answerId: thread.answerId === event.id ? null : thread.answerId,
      };
    }
    case "helpful":
      if (event.target === "thread") return event.id === thread.id ? { ...thread, helpful: event.count } : thread;
      return { ...thread, replies: thread.replies.map((r) => (r.id === event.id ? { ...r, helpful: event.count } : r)) };
    default:
      return thread;
  }
}

/** Two `datetime-local` style strings (local time) → epoch milliseconds. */
export function meetupTimes(date: string, start: string, end: string): { startsAt: number; endsAt: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
  const startsAt = new Date(`${date}T${start}`).getTime();
  let endsAt = new Date(`${date}T${end}`).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return null;
  if (endsAt <= startsAt) endsAt += DAY; // ends after midnight
  return { startsAt, endsAt };
}
