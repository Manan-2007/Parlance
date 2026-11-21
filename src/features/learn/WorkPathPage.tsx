/**
 * Signs for your work: one path (clinic, police, bank…), taught in parts, with
 * the cards Deaf visitors may show you and a printable desk poster.
 */
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Printer, WalletCards } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { QrCode } from "@/components/ui/QrCode";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { lessonKey } from "@/learn/curriculum";
import { getWorkPath, workDeckId, workParts } from "@/learn/workPaths";
import { WORK_ICONS } from "./workIcons";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { capitalise, englishOf } from "./signData";


function DeskPoster() {
  const link = `${location.origin}/app/cards`;
  return (
    <div className="hidden print:block">
      <div className="mx-auto flex max-w-[44rem] flex-col items-center rounded-[2rem] border-4 border-navy p-10 text-center text-navy">
        <p className="text-2xl font-extrabold">Deaf-friendly desk</p>
        <p lang="hi" className="text-xl font-bold">बधिर-अनुकूल काउंटर</p>
        <h2 className="mt-6 text-[3.25rem] leading-[1.05] font-extrabold tracking-[-0.04em]">Deaf? We are happy to help.</h2>
        <p lang="hi" className="mt-2 text-[1.75rem] leading-tight font-bold">बधिर हैं? हम मदद करेंगे।</p>
        <ul className="mt-8 grid gap-2 text-left text-xl leading-8 font-semibold">
          <li>Show us your card or your phone.</li>
          <li>Write or type to us. We will write back.</li>
          <li>Some of our staff know basic Indian Sign Language.</li>
        </ul>
        <div className="mt-8 w-56">
          <QrCode value={link} label="QR code for Parlance cards" />
        </div>
        <p className="mt-3 text-base font-semibold">No card? Scan for free ready-made cards: Parlance</p>
      </div>
    </div>
  );
}

export function WorkPathPage() {
  const { pathId } = useParams();
  const path = getWorkPath(pathId);
  const library = useSignLibrary();
  const lessons = useLearn((s) => s.lessons);
  useDocumentTitle(path ? `Signs for ${path.title.toLowerCase()}` : "Signs for your work");

  if (!path) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ArrowLeft />} title="Path not found" action={<ButtonLink to="/app/learn">Back to Learn</ButtonLink>} />
      </div>
    );
  }

  const Icon = WORK_ICONS[path.icon];
  const parts = workParts(path, library.loaded ? library.available : undefined);
  const done = parts.filter((_, i) => lessons[lessonKey("deck", workDeckId(path.id, i))]).length;
  const nextPart = parts.findIndex((_, i) => !lessons[lessonKey("deck", workDeckId(path.id, i))]);

  return (
    <>
      <div className="container-page py-8 sm:py-12 print:hidden">
        <Link to="/app/learn#work" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-ink-3 hover:text-navy">
          <ArrowLeft className="size-4" aria-hidden /> Learn
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-8">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy">
              <Icon className="size-6" aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-royal!">Signs for your work</p>
              <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] text-navy sm:text-[2.75rem]">{path.title}</h1>
              <p className="mt-1 text-[1.0625rem] text-ink-2">For {path.who.toLowerCase()}.</p>
            </div>
          </div>
          <p className="text-sm text-ink-3">
            <span className="text-2xl font-semibold text-navy tabular-nums">{done}</span> of {parts.length} parts done
          </p>
        </div>

        <section aria-labelledby="parts-title" className="mt-8">
          <h2 id="parts-title" className="text-2xl font-semibold tracking-[-0.03em] text-navy">Lessons</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-3">About five minutes each: watch, recognise, then sign with your camera.</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parts.map((signs, i) => {
              const complete = Boolean(lessons[lessonKey("deck", workDeckId(path.id, i))]);
              const isNext = i === nextPart;
              return (
                <li key={i}>
                  <Link
                    to={`/app/learn/work/${path.id}/lesson?part=${i}`}
                    className={cn(
                      "group flex h-full flex-col rounded-2xl p-5 transition-[border-color,box-shadow]",
                      isNext ? "bg-navy text-white" : "border border-line bg-surface hover:border-royal/50 hover:shadow-[var(--shadow-md)]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm font-semibold", isNext ? "text-white/70" : "text-ink-3")}>Part {i + 1}</span>
                      {complete && <CheckCircle2 className={cn("size-5", isNext ? "text-white" : "text-success")} aria-label="Done" />}
                    </span>
                    <span className={cn("mt-2 flex-1 text-[1.0625rem] leading-6 font-semibold", isNext ? "text-white" : "text-navy")}>
                      {signs.map((key) => capitalise(englishOf(key, library))).join(", ")}
                    </span>
                    <span className={cn("mt-4 inline-flex items-center gap-1.5 text-sm font-bold", isNext ? "text-sun-300" : "text-royal")}>
                      {complete ? "Practise again" : isNext ? "Start" : "Open"} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="signs-title" className="mt-12">
          <h2 id="signs-title" className="text-2xl font-semibold tracking-[-0.03em] text-navy">Every sign in this path</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {parts.flat().map((key) => (
              <li key={key}>
                <Link
                  to={`/app/learn/signs/${encodeURIComponent(key)}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-3.5 text-[0.9375rem] font-medium text-ink hover:border-royal/50 hover:text-royal"
                >
                  {capitalise(englishOf(key, library))}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="desk-title" className="mt-12 grid gap-3 lg:grid-cols-2">
          {path.cardPlace && (
            <Link to={`/app/cards/${path.cardPlace}`} className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 hover:border-royal/50">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-sun-100 text-sun-800">
                <WalletCards className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-lg font-semibold text-navy group-hover:text-royal">Cards Deaf visitors may show you</span>
                <span className="mt-1 block text-sm leading-6 text-ink-2">
                  See what they say and the replies you can tap back. Knowing them makes a visit quicker for both of you.
                </span>
              </span>
            </Link>
          )}
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-sky-50 p-6 ring-1 ring-sky-200">
            <div>
              <h2 id="desk-title" className="text-lg font-semibold text-navy">Make your desk Deaf-friendly</h2>
              <p className="mt-1 text-sm leading-6 text-ink-2">
                Print a poster for your counter. It tells Deaf visitors they can show a card or write to you, with a QR code to free cards if they
                don't have any.
              </p>
            </div>
            <Button variant="secondary" onClick={() => window.print()} leading={<Printer aria-hidden />}>
              Print desk poster
            </Button>
          </div>
        </section>
      </div>
      <DeskPoster />
    </>
  );
}
