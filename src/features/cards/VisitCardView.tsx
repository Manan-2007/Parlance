/** A visit card as staff see it: on screen, shared on their phone, or printed. */
import { Ear } from "lucide-react";
import { cn } from "@/lib/cn";
import { needsLines, type VisitCard } from "@/lib/visitCard";

export function visitRows(card: VisitCard): { label: string; value: string }[] {
  return [
    { label: "Visit", value: card.place },
    { label: "Why I am here", value: card.reason },
    { label: "Since", value: card.since },
    { label: "Symptoms", value: card.symptoms },
    { label: "Medicines I take", value: card.medicines },
    { label: "Allergies", value: card.allergies },
    { label: "My questions", value: card.questions },
  ].filter((row) => row.value.trim());
}

export function VisitCardView({ card, className }: { card: VisitCard; className?: string }) {
  const needs = needsLines(card.needs);
  const rows = visitRows(card);
  return (
    <article aria-label="Visit card" className={cn("rounded-[2rem] bg-sun-400 p-6 text-navy sm:p-7 print:bg-white print:ring-2 print:ring-navy", className)}>
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white print:hidden">
          <Ear className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy/70">{card.name ? `Visit card · ${card.name}` : "Visit card"}</p>
          <h2 className="text-[1.75rem] leading-8 font-extrabold tracking-[-0.03em]">I am Deaf.</h2>
          <p lang="hi" className="text-base font-bold text-navy/75">मैं बधिर हूँ।</p>
        </div>
      </div>
      {needs.length > 0 && (
        <ul className="mt-4 grid gap-1.5">
          {needs.map((line) => (
            <li key={line} className="rounded-[1rem] bg-surface/70 px-3.5 py-2 text-[1.0625rem] leading-6 font-bold">
              {line}
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 ? (
        <dl className="mt-5 grid gap-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-sm font-bold text-navy/70">{row.label}</dt>
              <dd className="mt-0.5 text-[1.125rem] leading-7 font-semibold whitespace-pre-line">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-5 text-[0.9375rem] leading-6 text-navy/75">What you write appears here, the way staff will see it.</p>
      )}
    </article>
  );
}
