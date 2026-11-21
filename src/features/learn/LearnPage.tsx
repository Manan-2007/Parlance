/**
 * The Learn hub: what to do today, the units, phrases saved from the
 * translator, and an honest note on how Parlance teaches.
 */
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, Camera, CheckCircle2, Layers, Library, MessagesSquare, PencilRuler, Repeat2, ScanEye, ShieldCheck, Sparkles, SpellCheck, Trash2, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { CONVERSATION_LESSON_ID, UNITS } from "@/learn/curriculum";
import { glossForToken } from "@/learn/lessonPlan";
import { dueCards, isLearned, practiceStreak, signsToWorkOn } from "@/learn/srs";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { localDay, useLearn } from "@/stores/learn";
import { findCustomSign, useTeach } from "@/stores/teach";
import { isCustomKey } from "@/learn/recordings";
import { readableSignLabel } from "@/translation/islVocabulary.js";
import { capitalise, englishOf } from "./signData";
import { UNIT_ICONS, unitProgress } from "./units";
import { SignOfTheDay } from "./SignOfTheDay";
import { WORK_ICONS } from "./workIcons";
import { WORK_PATHS, workDeckId, workParts } from "@/learn/workPaths";
import { lessonKey } from "@/learn/curriculum";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

function weekDays(days: readonly string[]): { label: string; done: boolean; today: boolean }[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return WEEK.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDay(d.getTime());
    return { label, done: days.includes(key), today: key === localDay() };
  });
}

export function LearnPage() {
  useDocumentTitle("Learn ISL");
  const library = useSignLibrary();
  const cards = useLearn((s) => s.cards);
  const lessons = useLearn((s) => s.lessons);
  const phrases = useLearn((s) => s.phrases);
  const days = useLearn((s) => s.days);
  const removePhrase = useLearn((s) => s.removePhrase);

  const teach = useTeach();
  const due = dueCards(cards, Date.now()).filter((c) => !isCustomKey(c.gloss) || !teach.hydrated || findCustomSign(c.gloss, teach)).length;
  const learned = Object.values(cards).filter(isLearned).length;
  const seen = Object.keys(cards).length;
  const started = Object.keys(lessons).length > 0;
  const continueAt = (() => {
    for (const unit of UNITS) {
      const progress = unitProgress(unit, lessons);
      if (progress.next) return { unit, lessonId: progress.next };
    }
    return null;
  })();
  const continueLesson = continueAt
    ? continueAt.lessonId === CONVERSATION_LESSON_ID
      ? continueAt.unit.dialogue?.title ?? "Conversation"
      : continueAt.unit.lessons.find((l) => l.id === continueAt.lessonId)?.title
    : null;
  const week = weekDays(days);
  const streak = practiceStreak(days, localDay());
  const workOn = signsToWorkOn(cards).filter((c) => (isCustomKey(c.gloss) ? teach.hydrated && findCustomSign(c.gloss, teach) : library.available.has(c.gloss)));

  return (
    <div className="container-page py-8 sm:py-12">
      {/* header */}
      <div className="grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow text-royal!">Learn Indian Sign Language</p>
          <h1 className="mt-3 max-w-3xl text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[3rem]">
            Learn the language of the people around you.
          </h1>
          <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
            Real signs from the official ISLRTC dictionary, practice that checks your signing on this device, and phrases for the moments
            that matter: a first hello, a clinic, an emergency.
          </p>
        </div>
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="text-ink-3">Signs seen</dt>
            <dd className="text-2xl font-semibold text-navy tabular-nums">{seen}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Learned</dt>
            <dd className="text-2xl font-semibold text-navy tabular-nums">{learned}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Day streak</dt>
            <dd className="text-2xl font-semibold text-navy tabular-nums">{streak}</dd>
          </div>
        </dl>
      </div>

      {/* today */}
      <section aria-label="Today" className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
          <p className="text-sm font-medium text-white/70">{started ? "Continue where you left off" : "Start here"}</p>
          {continueAt ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{continueLesson}</h2>
              <p className="mt-1 text-white/75">{continueAt.unit.title}</p>
              <ButtonLink to={`/app/learn/${continueAt.unit.id}/${continueAt.lessonId}`} variant="inverse" className="mt-6" trailing={<ArrowRight aria-hidden />}>
                {started ? "Continue" : "Start the first lesson"}
              </ButtonLink>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Every lesson done</h2>
              <p className="mt-1 text-white/75">Keep the signs fresh with reviews, or practise any sign from the library.</p>
            </>
          )}
          <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 size-64 rounded-full border-[18px] border-gold/30" />
        </div>
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-royal">
              <Repeat2 className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-navy">{due > 0 ? `${due} sign${due === 1 ? "" : "s"} to review` : "Nothing to review right now"}</h2>
              <p className="text-sm leading-6 text-ink-3">Signs come back just before you would forget them. A few minutes a day is enough.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ol className="flex gap-1.5" aria-label="Days practised this week">
              {week.map((d, i) => (
                <li key={i} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "size-6 rounded-full",
                      d.done ? "bg-gold" : "bg-line-soft",
                      d.today && "ring-2 ring-royal ring-offset-2",
                    )}
                    aria-label={`${d.label}${d.done ? ", practised" : ""}`}
                  />
                  <span className="text-[0.6875rem] font-medium text-ink-3" aria-hidden>
                    {d.label}
                  </span>
                </li>
              ))}
            </ol>
            <ButtonLink to="/app/learn/review" variant={due > 0 ? "primary" : "secondary"} aria-disabled={due === 0} tabIndex={due === 0 ? -1 : undefined}>
              Review now
            </ButtonLink>
          </div>
        </div>
      </section>

      <SignOfTheDay className="mt-3" />

      {workOn.length > 0 && (
        <section aria-labelledby="work-title" className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 id="work-title" className="text-lg font-semibold text-navy">Signs to work on</h2>
          <p className="mt-1 text-sm leading-6 text-ink-3">Signs you forgot after learning them, or whose camera match was weak. A few extra goes fixes most of them.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {workOn.map((card) => (
              <li key={card.gloss}>
                <Link
                  to={`/app/learn/signs/${encodeURIComponent(card.gloss)}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-paper px-3.5 text-[0.9375rem] font-medium text-ink hover:border-royal/50 hover:text-royal"
                >
                  {capitalise(englishOf(card.gloss, library))}
                  <span className="text-xs font-normal text-ink-3">
                    {card.lapses > 0 ? `forgot ${card.lapses}×` : `match ${card.bestScore}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* units */}
      <section aria-labelledby="units-title" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="units-title" className="text-2xl font-semibold tracking-[-0.03em] text-navy">Units</h2>
            <p className="mt-1 text-[0.9375rem] text-ink-3">Built around real situations. Take them in any order.</p>
          </div>
          <Link to="/app/learn/signs" className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-royal hover:underline">
            <Library className="size-4" aria-hidden /> Sign library
          </Link>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UNITS.map((unit, i) => {
            const Icon = UNIT_ICONS[unit.icon];
            const progress = unitProgress(unit, lessons);
            const complete = progress.done === progress.total;
            return (
              <li key={unit.id}>
                <Link
                  to={`/app/learn/${unit.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-royal/50 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-sky-100 text-royal">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold text-ink-3 tabular-nums">
                      {complete ? <CheckCircle2 className="size-5 text-success" aria-label="Complete" /> : `Unit ${i + 1}`}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-navy group-hover:text-royal">{unit.title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-6 text-ink-2">{unit.tagline}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium text-ink-3">
                      <span>
                        {progress.done} of {progress.total} lessons
                      </span>
                      <span>{unit.lessons.reduce((n, l) => n + l.signs.length, 0)} signs</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* signs for your work */}
      <section id="work" aria-labelledby="work-paths-title" className="mt-12 scroll-mt-24">
        <h2 id="work-paths-title" className="text-2xl font-semibold tracking-[-0.03em] text-navy">Signs for your work</h2>
        <p className="mt-1 max-w-2xl text-[0.9375rem] text-ink-3">
          Serve Deaf visitors at a clinic, police station, bank, station, shop or school. Short lessons with the signs that come up most.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORK_PATHS.map((path) => {
            const Icon = WORK_ICONS[path.icon];
            const parts = workParts(path, library.loaded ? library.available : undefined);
            const done = parts.filter((_, i) => lessons[lessonKey("deck", workDeckId(path.id, i))]).length;
            return (
              <li key={path.id}>
                <Link
                  to={`/app/learn/work/${path.id}`}
                  className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-royal/50 hover:shadow-[var(--shadow-md)]"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-sun-100 text-sun-800">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold tracking-[-0.02em] text-navy group-hover:text-royal">{path.title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-ink-2">{path.who}</span>
                    <span className="mt-2 block text-xs font-medium text-ink-3">
                      {parts.flat().length} signs · {done ? `${done} of ${parts.length} parts done` : `${parts.length} short lessons`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* more ways to practise */}
      <section aria-labelledby="more-title" className="mt-12">
        <h2 id="more-title" className="text-2xl font-semibold tracking-[-0.03em] text-navy">More ways to practise</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: "/app/learn/together", icon: Users, title: "Practise together", body: "Two people, one screen: one signs, the other reads. Or have a fluent signer check you." },
            { to: "/app/learn/alphabet", icon: BookOpenText, title: "The ISL alphabet", body: "Flip a card for every letter's tip, then test yourself with a quick quiz." },
            { to: "/app/learn/fingerspelling", icon: SpellCheck, title: "Fingerspelling", body: "Read names spelled at speed, and learn to spell your own." },
            { to: "/app/learn/reader", icon: ScanEye, title: "Sign to the reader", body: "See whether Parlance's sign recogniser reads your signing. Needs the recognition service running." },
            { to: "/app/learn/teach", icon: PencilRuler, title: "Teach", body: "Record signs in your own hands and share a deck with your class, family or team." },
            { to: "/app/learn/check-signs", icon: ShieldCheck, title: "Check signs", body: "Fluent in ISL? Mark Parlance's 3D signs and letters correct or wrong, and share your checks." },
          ].map(({ to, icon: Icon, title, body }) => (
            <li key={to}>
              <Link to={to} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-royal/50 hover:shadow-[var(--shadow-md)]">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gold-100 text-gold-800">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-navy group-hover:text-royal">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-2">{body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* decks */}
      {teach.decks.length > 0 && (
        <section aria-labelledby="decks-title" className="mt-12">
          <h2 id="decks-title" className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.03em] text-navy">
            <Layers className="size-5 text-royal" aria-hidden /> Decks
          </h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
            {teach.decks.map((deck) => (
              <li key={deck.id}>
                <Link to={`/app/learn/decks/${deck.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-brand-25 sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy">{deck.title}</span>
                    <span className="block text-xs text-ink-3">
                      {deck.own ? "Made by you" : deck.author ? `Shared by ${deck.author}` : "Shared with you"} · {deck.items.length} signs
                      {lessons[`deck/${deck.id}`] ? " · done" : ""}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* phrases from the translator */}
      <section aria-labelledby="phrases-title" className="mt-12">
        <h2 id="phrases-title" className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.03em] text-navy">
          <MessagesSquare className="size-5 text-royal" aria-hidden /> My phrases
        </h2>
        {phrases.length === 0 ? (
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-7 text-ink-2">
            Learn what you actually need. In{" "}
            <Link to="/app/speech-to-sign" className="font-medium text-royal hover:underline">
              Speech → Sign
            </Link>{" "}
            or History, press <strong className="font-semibold">Practise</strong> on any message and it becomes a short lesson here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
            {phrases.map((phrase) => (
              <li key={phrase.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{phrase.text}</p>
                  <p className="mt-0.5 text-xs tracking-[0.04em] text-ink-3 uppercase">
                    {phrase.tokens
                      .map((token) => {
                        const gloss = glossForToken(token, library.available);
                        return gloss ? englishOf(gloss, library) : readableSignLabel(token);
                      })
                      .join(" · ")}
                  </p>
                </div>
                <ButtonLink to={`/app/learn/phrase/${phrase.id}`} size="sm">
                  Practise
                </ButtonLink>
                <button
                  type="button"
                  onClick={() => removePhrase(phrase.id)}
                  aria-label={`Remove "${phrase.text}"`}
                  className="inline-flex size-9 items-center justify-center rounded-full text-ink-3 hover:bg-subtle hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* how it teaches */}
      <section aria-labelledby="how-title" className="mt-12 rounded-2xl bg-sky-50 p-6 ring-1 ring-sky-200 sm:p-8">
        <h2 id="how-title" className="text-xl font-semibold tracking-[-0.02em] text-navy">How Parlance teaches</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: BookOpenText,
              title: "Real signs",
              body: "Every sign is the national ISLRTC dictionary form, shown as a moving figure built from the official recording, with the original video one tap away. The avatar's 3D signs are labelled approximate.",
            },
            {
              icon: Camera,
              title: "Honest feedback",
              body: "Practice compares your hands with the recording: which hands, where, their shape, palm direction and movement. It can't read your face, so it never claims to judge a whole sign.",
            },
            {
              icon: Sparkles,
              title: "Built to stick",
              body: "You make every sign yourself, recall it in short quizzes, and see it again on a spaced schedule. Phrases are taught in ISL word order, with the grammar explained.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="size-5 text-royal" aria-hidden />
              <h3 className="mt-3 font-semibold text-navy">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-2">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-start gap-2 border-t border-sky-200 pt-4 text-xs leading-5 text-ink-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Sign recordings: Indian Sign Language Research and Training Centre (ISLRTC), Government of India, dictionary videos on youtube.com/@islrtc.
          Parlance stores hand positions only, never video. Progress is saved in this browser and nowhere else.
        </p>
      </section>
    </div>
  );
}
