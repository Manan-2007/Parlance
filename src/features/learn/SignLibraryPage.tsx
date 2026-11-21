import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { curriculumGlosses } from "@/learn/curriculum";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";

const TAUGHT = new Set(curriculumGlosses());

export function SignLibraryPage() {
  useDocumentTitle("Sign library");
  const library = useSignLibrary();
  const cards = useLearn((s) => s.cards);
  const [query, setQuery] = useState("");
  const [onlyLessons, setOnlyLessons] = useState(false);
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const signs = useMemo(
    () =>
      Object.entries(library.signs)
        .map(([gloss, entry]) => ({ gloss, english: entry.english, pos: entry.pos }))
        .filter((s) => (!onlyLessons || TAUGHT.has(s.gloss)) && (!deferred || s.english.toLowerCase().includes(deferred) || s.gloss.includes(deferred)))
        .sort((a, b) => a.english.localeCompare(b.english)),
    [library.signs, deferred, onlyLessons],
  );

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Learn
      </Link>
      <div className="mt-4 border-b border-line pb-8">
        <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[3rem]">Sign library</h1>
        <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
          {library.loaded ? `${Object.keys(library.signs).length} signs` : "Signs"} from the ISLRTC Indian Sign Language dictionary. Open any sign to watch it,
          see the official video and practise it with your camera.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="relative flex min-w-[min(100%,20rem)] flex-1 items-center sm:max-w-md">
            <span className="sr-only">Search signs</span>
            <Search className="pointer-events-none absolute left-3.5 size-4 text-ink-3" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in English"
              className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-10 text-[0.9375rem] outline-none focus:border-royal focus:shadow-[0_0_0_4px_rgb(13_33_161/0.1)]"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={onlyLessons} onChange={(e) => setOnlyLessons(e.target.checked)} />
            Only signs taught in lessons
          </label>
        </div>
      </div>
      <p className="mt-6 text-sm text-ink-3" role="status" aria-live="polite">
        {library.loaded ? `${signs.length} sign${signs.length === 1 ? "" : "s"}` : "Loading…"}
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {signs.map((sign) => (
          <li key={sign.gloss}>
            <Link
              to={`/app/learn/signs/${sign.gloss}`}
              className={cn(
                "flex h-full min-h-16 flex-col justify-center rounded-xl border bg-surface px-3.5 py-2.5 transition-colors hover:border-royal hover:bg-brand-25",
                cards[sign.gloss] ? "border-gold-300" : "border-line",
              )}
            >
              <span className="text-[0.9375rem] font-semibold text-navy">{sign.english}</span>
              <span className="text-xs text-ink-3">
                {sign.pos}
                {cards[sign.gloss] ? " · seen" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
