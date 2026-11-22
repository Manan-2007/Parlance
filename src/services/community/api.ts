/**
 * Calls to the local Community service (backend/community.py), reached
 * through the dev server at /api/community.
 */
import type {
  LiveMessage, LiveRoom, Member, PostInput, Reply, ReportReason, Space, SpaceId, Thread, ThreadDetail, ThreadKind, ThreadSort, Way,
} from "@/community/model";
import { useCommunity } from "@/stores/community";

export const COMMUNITY_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/community`;

export class CommunityApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }

  /** The service is not running or not reachable. */
  get offline() {
    return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504;
  }
}

async function call<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const token = useCommunity.getState().token;
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(`${COMMUNITY_BASE}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new CommunityApiError("Community is not reachable. Start Parlance with start.sh (or start.bat) and try again.", 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      // The token is no longer known (for example, the database was reset).
      const { token: current, signOut } = useCommunity.getState();
      if (current && token === current) signOut();
    }
    const message =
      typeof data?.error === "string"
        ? data.error
        : response.status >= 500
          ? "Community is not reachable. Start Parlance with start.sh (or start.bat) and try again."
          : "That did not work. Check what you wrote and try again.";
    throw new CommunityApiError(message, response.status);
  }
  return data as T;
}

export const communityApi = {
  spaces: (signal?: AbortSignal) => call<{ spaces: Space[] }>("/spaces", { signal }).then((r) => r.spaces),

  join: (handle: string, city: string, ways: Way[]) =>
    call<{ member: Member; token: string }>("/join", { method: "POST", body: { handle, city, ways } }),
  me: () => call<{ member: Member }>("/me").then((r) => r.member),
  updateMe: (city: string, ways: Way[]) =>
    call<{ member: Member }>("/me", { method: "PATCH", body: { city, ways } }).then((r) => r.member),

  threads: (options: { space?: SpaceId; sort?: ThreadSort; q?: string; offset?: number }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (options.space) params.set("space", options.space);
    if (options.sort) params.set("sort", options.sort);
    if (options.q?.trim()) params.set("q", options.q.trim());
    if (options.offset) params.set("offset", String(options.offset));
    return call<{ threads: Thread[] }>(`/threads?${params}`, { signal }).then((r) => r.threads);
  },
  thread: (id: number, signal?: AbortSignal) => call<{ thread: ThreadDetail; reading: number }>(`/threads/${id}`, { signal }),
  createThread: (post: {
    space: SpaceId;
    kind: ThreadKind;
    title: string;
    body: string;
    input: PostInput;
    meetup?: { place: string; city: string; startsAt: number; endsAt: number };
  }) => call<{ thread: Thread }>("/threads", { method: "POST", body: post }).then((r) => r.thread),
  editThread: (id: number, title: string, body: string) =>
    call<{ thread: Thread }>(`/threads/${id}`, { method: "PATCH", body: { title, body } }).then((r) => r.thread),
  deleteThread: (id: number) => call<{ ok: true }>(`/threads/${id}`, { method: "DELETE" }),

  reply: (threadId: number, body: string, input: PostInput, quoteId: number | null) =>
    call<{ reply: Reply }>(`/threads/${threadId}/replies`, { method: "POST", body: { body, input, quoteId } }).then((r) => r.reply),
  editReply: (id: number, body: string) =>
    call<{ reply: Reply }>(`/replies/${id}`, { method: "PATCH", body: { body } }).then((r) => r.reply),
  deleteReply: (id: number) => call<{ ok: true }>(`/replies/${id}`, { method: "DELETE" }),

  helpful: (target: "thread" | "reply", id: number, on: boolean) =>
    call<{ count: number }>(`/${target === "thread" ? "threads" : "replies"}/${id}/helpful`, { method: "POST", body: { on } }),
  report: (target: "thread" | "reply", id: number, reason: ReportReason) =>
    call<{ hidden: boolean }>(`/${target === "thread" ? "threads" : "replies"}/${id}/report`, { method: "POST", body: { reason } }),
  answer: (threadId: number, replyId: number | null) =>
    call<{ thread: Thread }>(`/threads/${threadId}/answer`, { method: "POST", body: { replyId } }).then((r) => r.thread),
  going: (threadId: number, on: boolean) =>
    call<{ thread: Thread }>(`/threads/${threadId}/going`, { method: "POST", body: { on } }).then((r) => r.thread),

  startLive: (threadId: number) => call<{ thread: Thread }>(`/threads/${threadId}/live`, { method: "POST" }).then((r) => r.thread),
  endLive: (threadId: number) => call<{ ok: true }>(`/threads/${threadId}/live`, { method: "DELETE" }),
  live: (code: string, signal?: AbortSignal) => call<{ room: LiveRoom; here: number }>(`/live/${code}`, { signal }),
  sayLive: (code: string, text: string, input: PostInput) =>
    call<{ message: LiveMessage }>(`/live/${code}/messages`, { method: "POST", body: { text, input } }).then((r) => r.message),
};
