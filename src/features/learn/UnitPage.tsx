import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, HeartHandshake, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONVERSATION_LESSON_ID, ETIQUETTE_SOURCE, GRAMMAR_RULES, getUnit, lessonKey } from "@/learn/curriculum";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { englishOf } from "./signData";
import { UNIT_ICONS, unitProgress } from "./units";

export function UnitPage() {
  const { unitId } = useParams();
  const unit = unitId ? getUnit(unitId) : undefined;
  const library = useSignLibrary();
  const lessons = useLearn((s) => s.lessons);
  useDocumentTitle(unit?.title ?? "Unit");

  if (!unit) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ArrowLeft />} title="Unit not found" action={<ButtonLink to="/app/learn">Back to Learn</ButtonLink>} />
      </div>
    );
  }

  const Icon = UNIT_ICONS[unit.icon];
  const progress = unitProgress(unit, lessons);
  const rows = [
    ...unit.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, meta: `${lesson.signs.length} signs`, conversation: false })),
    ...(unit.dialogue
      ? [{ id: CONVERSATION_LESSON_ID, title: unit.dialogue.title, summary: unit.dialogue.setting, meta: "Role-play", conversation: true }]
      : []),
  ];
  const signs = [...new Set(unit.lessons.flatMap((l) => l.signs))];

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> All units
      </Link>
      <div className="mt-4 flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-royal">
            <Icon className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[2.75rem]">{unit.title}</h1>
            <p className="mt-2 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">{unit.situation}</p>
          </div>
        </div>
        {progress.next && (
          <ButtonLink to={`/app/learn/${unit.id}/${progress.next}`} trailing={<ArrowRight aria-hidden />}>
            {progress.done ? "Continue" : "Start"}
          </ButtonLink>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="lessons-title">
          <h2 id="lessons-title" className="eyebrow">
            Lessons · {progress.done} of {progress.total} done
          </h2>
          <ol className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
            {rows.map((row, i) => {
              const record = lessons[lessonKey(unit.id, row.id)];
              return (
                <li key={row.id}>
                  <Link to={`/app/learn/${unit.id}/${row.id}`} className="group flex items-center gap-4 px-4 py-4 hover:bg-brand-25 sm:px-5">
                    <span
                      className={cn(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                        record ? "bg-success-bg text-success" : row.conversation ? "bg-gold-100 text-gold-800" : "bg-sky-100 text-royal",
                      )}
                    >
                      {record ? <CheckCircle2 className="size-5" aria-label="Done" /> : row.conversation ? <MessageCircle className="size-4" aria-hidden /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-navy group-hover:text-royal">{row.title}</span>
                      <span className="block text-sm leading-6 text-ink-3">{row.summary}</span>
                    </span>
                    <span className="hidden text-xs font-medium text-ink-3 sm:block">
                      {record ? `${record.correct}/${record.total} right` : row.meta}
                    </span>
                    <ArrowRight className="size-4 text-ink-3 group-hover:text-royal" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>

          <h2 className="eyebrow mt-10">Phrases in ISL order</h2>
          <ul className="mt-3 space-y-2.5">
            {unit.phrases.map((phrase) => (
              <li key={phrase.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className="font-medium text-ink">{phrase.english}</p>
                <p className="mt-1 text-[0.8125rem] font-semibold tracking-[0.05em] text-navy uppercase">
                  {phrase.glosses.map((g) => englishOf(g, library)).join(" · ")}
                </p>
                {phrase.rules.length > 0 && (
                  <p className="mt-1 text-xs text-ink-3">{phrase.rules.map((rule) => GRAMMAR_RULES[rule].title).join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="signs-title">
            <h2 id="signs-title" className="eyebrow">
              Signs in this unit
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {signs.map((gloss) => (
                <li key={gloss}>
                  <Link
                    to={`/app/learn/signs/${gloss}`}
                    className="inline-flex h-9 items-center rounded-full bg-surface px-3.5 text-[0.8125rem] font-semibold tracking-[0.04em] text-navy uppercase ring-1 ring-line-strong hover:ring-royal"
                  >
                    {englishOf(gloss, library)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="etiquette-title" className="rounded-2xl bg-gold-50 p-5 ring-1 ring-gold-300">
            <h2 id="etiquette-title" className="flex items-center gap-2 font-semibold text-navy">
              <HeartHandshake className="size-5 text-gold-800" aria-hidden /> {unit.etiquette.title}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {unit.etiquette.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-[0.9375rem] leading-6 text-ink-2">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold-800" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-ink-3">{ETIQUETTE_SOURCE}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
