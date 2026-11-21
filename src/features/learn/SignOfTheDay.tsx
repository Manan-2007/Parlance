/** Today's sign: one ISLRTC sign a day, the same for everyone, a minute to learn. */
import { Link } from "react-router-dom";
import { ArrowRight, Sun } from "lucide-react";
import { signOfTheDay } from "@/learn/workPaths";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { localDay, useLearn } from "@/stores/learn";
import { ReferencePlayer } from "./ReferencePlayer";
import { capitalise, englishOf } from "./signData";

export function useSignOfTheDay(): string | null {
  const library = useSignLibrary();
  if (!library.loaded) return null;
  return signOfTheDay([...library.available], localDay());
}

export function SignOfTheDay({ className, showPlayer = true }: { className?: string; showPlayer?: boolean }) {
  const library = useSignLibrary();
  const gloss = useSignOfTheDay();
  const known = useLearn((s) => (gloss ? Boolean(s.cards[gloss]) : false));
  if (!gloss) return <div className={cn("min-h-40 animate-pulse rounded-2xl bg-paper-2", className)} aria-hidden />;
  const english = capitalise(englishOf(gloss, library));
  return (
    <section aria-labelledby="sotd-title" className={cn("grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-center sm:p-6", className)}>
      {showPlayer && (
        <div className="overflow-hidden rounded-xl bg-paper-50">
          <ReferencePlayer glosses={[gloss]} compact label={`The ISLRTC signer signing ${english}`} />
        </div>
      )}
      <div>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-sun-800">
          <Sun className="size-4" aria-hidden /> Sign of the day
        </p>
        <h2 id="sotd-title" className="mt-1 text-[1.75rem] leading-8 font-semibold tracking-[-0.035em] text-navy">
          {english}
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-3">{known ? "Already in your reviews. Sign it once more today." : "A new sign every day. Watch it, then try it with your camera."}</p>
        <Link
          to={`/app/learn/signs/${encodeURIComponent(gloss)}`}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-[0.9375rem] font-bold text-royal hover:underline"
        >
          Learn it <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
