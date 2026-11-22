import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MessagesSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { upsertThread, type CommunityEvent, type SpaceId, type Thread, type ThreadSort } from "@/community/model";
import { communityApi } from "@/services/community/api";
import { useCommunityEvents } from "@/services/community/useCommunityEvents";
import { errorMessage, OfflineNotice, ThreadCard, useMinuteTick } from "./parts";

const SORTS: { value: ThreadSort; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "new", label: "New" },
  { value: "unanswered", label: "Unanswered" },
  { value: "meetups", label: "Meetups" },
];

/** Threads (optionally in one space), sorted and searchable, updated live. */
export function ThreadList({ space, initialSort = "active", emptyAction }: { space?: SpaceId; initialSort?: ThreadSort; emptyAction?: React.ReactNode }) {
  useMinuteTick();
  const [sort, setSort] = useState<ThreadSort>(initialSort);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchId = useId();
  const refresh = useRef<number | undefined>(undefined);

  const load = useCallback(
    (signal?: AbortSignal) =>
      communityApi
        .threads({ space, sort, q: search }, signal)
        .then((list) => {
          setThreads(list);
          setMore(list.length === 30);
          setError(null);
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setError(errorMessage(e));
        }),
    [space, sort, search],
  );

  useEffect(() => {
    const controller = new AbortController();
    setThreads(null);
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // New posts appear at once; other activity refreshes the list (at most once a second).
  useCommunityEvents("feed", (event: CommunityEvent) => {
    if (event.type === "thread-new") {
      if ((space && event.thread.space !== space) || search) return;
      setThreads((list) => (list ? upsertThread(list, event.thread, sort) : list));
    } else if (event.type === "activity") {
      window.clearTimeout(refresh.current);
      refresh.current = window.setTimeout(() => void load(), 1000);
    }
  });
  useEffect(() => () => window.clearTimeout(refresh.current), []);

  const loadMore = async () => {
    if (!threads) return;
    setLoadingMore(true);
    try {
      const next = await communityApi.threads({ space, sort, q: search, offset: threads.length });
      setThreads([...threads, ...next.filter((t) => !threads.some((have) => have.id === t.id))]);
      setMore(next.length === 30);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Sort posts" size="sm" value={sort} options={space === "meetups" ? SORTS.filter((s) => s.value !== "unanswered") : SORTS} onChange={setSort} />
        <form
          role="search"
          className="relative w-full sm:w-72"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(query.trim());
          }}
        >
          <label htmlFor={searchId} className="sr-only">Search posts</label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setSearch("");
            }}
            placeholder="Search posts"
            className="h-10 w-full rounded-full border-2 border-line bg-surface pr-4 pl-10 text-[0.9375rem] font-semibold text-ink hover:border-navy/50"
          />
        </form>
      </div>

      {error && <OfflineNotice error={error} onRetry={() => void load()} />}

      {!error && threads === null && (
        <ul className="grid gap-3" aria-label="Loading posts">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-32 animate-pulse rounded-[1.5rem] bg-surface ring-1 ring-line" />
          ))}
        </ul>
      )}

      {threads && threads.length === 0 && (
        <div className="rounded-[1.75rem] bg-surface ring-1 ring-line">
          <EmptyState icon={<MessagesSquare />} title={search ? "No posts match your search" : sort === "unanswered" ? "Every question has an answer" : "Nothing here yet"} action={emptyAction}>
            {search ? "Try other words, or start the conversation yourself." : "Be the first to start a conversation."}
          </EmptyState>
        </div>
      )}

      {threads && threads.length > 0 && (
        <ul className="grid gap-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <ThreadCard thread={thread} />
            </li>
          ))}
        </ul>
      )}

      {threads && more && (
        <div className="flex justify-center">
          <Button variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? "Loading…" : "Show more"}
          </Button>
        </div>
      )}
    </div>
  );
}
