/**
 * What fluent signers have said about a sign: checked, regional variant, or
 * flagged, with their notes. Built from this device's own checks plus any
 * review packs received.
 */
import { useMemo } from "react";
import { BadgeCheck, CircleHelp, Flag, Shuffle } from "lucide-react";
import { statusOf, summarize, type ReviewPack, type ReviewStatus, type ReviewSummary } from "@/learn/reviews";
import { cn } from "@/lib/cn";
import { myPack, useTeach } from "@/stores/teach";

export function useReviewSummaries(): Map<string, ReviewSummary> {
  const myReviews = useTeach((s) => s.myReviews);
  const myReviewId = useTeach((s) => s.myReviewId);
  const author = useTeach((s) => s.author);
  const region = useTeach((s) => s.region);
  const packs = useTeach((s) => s.reviewPacks);
  return useMemo(() => {
    const mine = myPack({ myReviews, myReviewId, author, region });
    const all: ReviewPack[] = [...(mine ? [mine] : []), ...packs.filter((p) => p.id !== myReviewId)];
    return summarize(all);
  }, [myReviews, myReviewId, author, region, packs]);
}

const STYLE: Record<ReviewStatus, { icon: typeof BadgeCheck; className: string }> = {
  checked: { icon: BadgeCheck, className: "bg-success-bg text-success ring-success/20" },
  variant: { icon: Shuffle, className: "bg-sky-50 text-royal ring-sky-200" },
  flagged: { icon: Flag, className: "bg-danger-bg text-danger ring-danger/20" },
  unchecked: { icon: CircleHelp, className: "bg-subtle text-ink-3 ring-line" },
};

export function reviewLabel(summary: ReviewSummary | undefined): string {
  const status = statusOf(summary);
  if (!summary || status === "unchecked") return "No community review yet";
  const people = (n: number) => `${n} reviewer${n === 1 ? "" : "s"}`;
  if (status === "flagged") return `Flagged as wrong by ${people(summary.wrong)}`;
  if (status === "variant") return `Regional variant, per ${people(summary.variant)}`;
  return `Marked correct by ${people(summary.correct)}${summary.wrong ? `, flagged by ${summary.wrong}` : ""}${summary.variant ? `, ${summary.variant} use a variant` : ""} · self-reported`;
}

export function ReviewBadge({ reviewKey, showUnchecked = true, showNotes = true, className }: { reviewKey: string; showUnchecked?: boolean; showNotes?: boolean; className?: string }) {
  const summaries = useReviewSummaries();
  const summary = summaries.get(reviewKey);
  const status = statusOf(summary);
  if (status === "unchecked" && !showUnchecked) return null;
  const { icon: Icon, className: tone } = STYLE[status];
  return (
    <div className={className}>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ring-1", tone)}>
        <Icon className="size-3.5" aria-hidden />
        {reviewLabel(summary)}
      </span>
      {showNotes && summary && summary.notes.length > 0 && (
        <ul className="mt-2 space-y-1 text-[0.8125rem] leading-5 text-ink-2">
          {summary.notes.slice(0, 3).map((n, i) => (
            <li key={i}>
              <span className="font-medium text-ink">{n.reviewer}</span>
              {n.region ? ` (${n.region})` : ""}: “{n.note}”
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
