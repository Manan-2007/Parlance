/**
 * Build a deck: choose signs (ISLRTC library and your own recordings), put
 * them in teaching order, add phrases in ISL order, then save or share.
 */
import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Check, GraduationCap, Plus, Save, Search, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { curriculumGlosses } from "@/learn/curriculum";
import { DECK_LIMITS, type Deck, type DeckPhrase } from "@/learn/decks";
import { customId, customKey, isCustomKey } from "@/learn/recordings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { createId } from "@/lib/id";
import { useSignLibrary } from "@/services/signs/library";
import { useTeach } from "@/stores/teach";
import { englishOf } from "../learn/signData";
import { ShareDeckDialog } from "./ShareDeckDialog";

const SUGGESTED = new Set(curriculumGlosses());

export function DeckEditorPage() {
  const { deckId = "new" } = useParams();
  const library = useSignLibrary();
  const hydrated = useTeach((s) => s.hydrated);
  const decks = useTeach((s) => s.decks);
  const existing = decks.find((d) => d.id === deckId);
  useDocumentTitle(existing ? `Edit ${existing.title}` : "New deck");
  if (!hydrated || !library.loaded) {
    return <p className="container-page py-16 text-center text-ink-3" role="status">Loading…</p>;
  }
  return <DeckEditor key={deckId} existing={existing} />;
}

function DeckEditor({ existing }: { existing: Deck | undefined }) {
  const navigate = useNavigate();
  const library = useSignLibrary();
  const recordings = useTeach((s) => s.recordings);
  const teachAuthor = useTeach((s) => s.author);
  const saveDeck = useTeach((s) => s.saveDeck);

  // Received decks are edited as a copy, so the original stays as shared.
  const [draft, setDraft] = useState(() => ({
    id: existing?.own ? existing.id : createId(),
    title: existing ? (existing.own ? existing.title : `Copy of ${existing.title}`) : "",
    description: existing?.description ?? "",
    author: existing?.own ? existing.author ?? teachAuthor : teachAuthor,
    items: existing?.items ?? [],
    phrases: existing?.phrases ?? [],
    createdAt: existing?.own ? existing.createdAt : Date.now(),
    signs: existing?.signs ?? [],
  }));
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const [phraseText, setPhraseText] = useState("");
  const [phraseItems, setPhraseItems] = useState<string[]>([]);
  const [sharing, setSharing] = useState<Deck | null>(null);

  const label = (key: string) => {
    if (!isCustomKey(key)) return englishOf(key, library);
    const id = customId(key);
    return recordings.find((r) => r.id === id)?.english ?? draft.signs.find((s) => s.id === id)?.english ?? "recording";
  };

  const results = useMemo(() => {
    const all = Object.entries(library.signs).map(([gloss, entry]) => ({ gloss, english: entry.english }));
    const filtered = deferred ? all.filter((s) => s.english.toLowerCase().includes(deferred) || s.gloss.includes(deferred)) : all.filter((s) => SUGGESTED.has(s.gloss));
    return filtered.sort((a, b) => a.english.localeCompare(b.english)).slice(0, deferred ? 60 : 100);
  }, [library.signs, deferred]);

  const has = (key: string) => draft.items.includes(key);
  const toggle = (key: string) =>
    setDraft((d) => {
      if (d.items.includes(key)) {
        return { ...d, items: d.items.filter((k) => k !== key), phrases: d.phrases.filter((p) => !p.items.includes(key)) };
      }
      return d.items.length >= DECK_LIMITS.items ? d : { ...d, items: [...d.items, key] };
    });
  const move = (index: number, by: number) =>
    setDraft((d) => {
      const items = [...d.items];
      const target = index + by;
      if (target < 0 || target >= items.length) return d;
      [items[index], items[target]] = [items[target]!, items[index]!];
      return { ...d, items };
    });

  const build = (): Deck | null => {
    if (!draft.title.trim()) {
      toast("Give the deck a title");
      return null;
    }
    if (draft.items.length < 2) {
      toast("Add at least two signs");
      return null;
    }
    const used = new Set([...draft.items, ...draft.phrases.flatMap((p) => p.items)].filter(isCustomKey).map(customId));
    const signs = [...used]
      .map((id) => recordings.find((r) => r.id === id) ?? draft.signs.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    return {
      id: draft.id,
      title: draft.title.trim().slice(0, 80),
      description: draft.description.trim().slice(0, 300) || undefined,
      author: draft.author.trim().slice(0, 40) || undefined,
      createdAt: draft.createdAt,
      items: draft.items,
      signs,
      phrases: draft.phrases,
      own: true,
    };
  };

  const save = (then?: (deck: Deck) => void) => {
    const deck = build();
    if (!deck) return;
    saveDeck(deck);
    if (then) then(deck);
    else {
      toast("Deck saved");
      navigate(`/app/learn/decks/${deck.id}`);
    }
  };

  const addPhrase = () => {
    if (!phraseText.trim() || phraseItems.length < 2) return;
    const phrase: DeckPhrase = { english: phraseText.trim().slice(0, 120), items: phraseItems };
    setDraft((d) => (d.phrases.length >= DECK_LIMITS.phrases ? d : { ...d, phrases: [...d.phrases, phrase] }));
    setPhraseText("");
    setPhraseItems([]);
  };

  const input = "mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal";

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn/teach" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Teach
      </Link>
      <h1 className="mt-4 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[2.75rem]">{existing?.own ? "Edit deck" : "Build a deck"}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* details + contents */}
        <div className="space-y-8">
          <section className="space-y-4" aria-label="About the deck">
            <label className="block">
              <span className="text-[0.9375rem] font-semibold text-ink">Title</span>
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value.slice(0, 80) }))} placeholder="e.g. Class 6, week 1" className={input} />
            </label>
            <label className="block">
              <span className="text-[0.9375rem] font-semibold text-ink">What it's for</span>
              <input
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value.slice(0, 300) }))}
                placeholder="Optional, e.g. 'Signs for our reception desk'"
                className={input}
              />
            </label>
            <label className="block">
              <span className="text-[0.9375rem] font-semibold text-ink">Made by</span>
              <input value={draft.author} onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value.slice(0, 40) }))} placeholder="Optional" className={input} />
            </label>
          </section>

          <section aria-labelledby="order-title">
            <h2 id="order-title" className="eyebrow">
              Signs, in teaching order · {draft.items.length}/{DECK_LIMITS.items}
            </h2>
            {draft.items.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">Add signs from the right.</p>
            ) : (
              <ol className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
                {draft.items.map((key, i) => (
                  <li key={key} className="flex items-center gap-2 px-3 py-2">
                    <span className="w-6 text-right text-xs font-medium text-ink-3 tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                      {label(key)}
                      {isCustomKey(key) && <span className="ml-2 text-xs font-normal text-gold-800">your recording</span>}
                    </span>
                    <button type="button" aria-label={`Move ${label(key)} up`} onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle disabled:opacity-30">
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button type="button" aria-label={`Move ${label(key)} down`} onClick={() => move(i, 1)} disabled={i === draft.items.length - 1} className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle disabled:opacity-30">
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button type="button" aria-label={`Remove ${label(key)}`} onClick={() => toggle(key)} className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle hover:text-danger">
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="phrases-title">
            <h2 id="phrases-title" className="eyebrow">
              Phrases in ISL order · {draft.phrases.length}/{DECK_LIMITS.phrases}
            </h2>
            {draft.phrases.length > 0 && (
              <ul className="mt-3 space-y-2">
                {draft.phrases.map((phrase, i) => (
                  <li key={`${phrase.english}-${i}`} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{phrase.english}</p>
                      <p className="mt-0.5 text-[0.8125rem] font-semibold tracking-[0.05em] text-navy uppercase">{phrase.items.map(label).join(" · ")}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove phrase ${phrase.english}`}
                      onClick={() => setDraft((d) => ({ ...d, phrases: d.phrases.filter((_, j) => j !== i) }))}
                      className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {draft.items.length >= 2 && (
              <div className="mt-3 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
                <label className="block">
                  <span className="text-sm font-semibold text-ink">A phrase in English</span>
                  <input value={phraseText} onChange={(e) => setPhraseText(e.target.value)} placeholder="e.g. Where is the canteen?" className={input} />
                </label>
                <p className="mt-3 text-sm font-semibold text-ink">Tap its signs in ISL order</p>
                <div className="mt-2 flex min-h-11 flex-wrap gap-1.5 rounded-lg border border-dashed border-line-strong bg-surface p-2">
                  {phraseItems.map((key, i) => (
                    <button key={`${key}-${i}`} type="button" onClick={() => setPhraseItems((p) => p.filter((_, j) => j !== i))} className="h-9 rounded-md bg-navy px-3 text-[0.8125rem] font-semibold tracking-[0.04em] text-white uppercase">
                      {label(key)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {draft.items.map((key) => (
                    <button
                      key={key}
                      type="button"
                      disabled={phraseItems.length >= DECK_LIMITS.phraseItems}
                      onClick={() => setPhraseItems((p) => [...p, key])}
                      className="h-9 rounded-md border border-line-strong bg-surface px-3 text-[0.8125rem] font-semibold tracking-[0.04em] text-navy uppercase hover:border-royal"
                    >
                      {label(key)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-ink-3">ISL order: time first, verb last, question words at the end. Learners rebuild this order.</p>
                <Button className="mt-3" size="sm" onClick={addPhrase} disabled={!phraseText.trim() || phraseItems.length < 2} leading={<Plus aria-hidden />}>
                  Add phrase
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* pickers */}
        <div className="space-y-8">
          {recordings.length > 0 && (
            <section aria-labelledby="mine-title">
              <h2 id="mine-title" className="eyebrow">
                Your recordings
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {recordings.map((sign) => {
                  const key = customKey(sign.id);
                  return (
                    <li key={sign.id}>
                      <button
                        type="button"
                        aria-pressed={has(key)}
                        onClick={() => toggle(key)}
                        className={cn(
                          "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.875rem] font-medium ring-1 transition-colors",
                          has(key) ? "bg-gold-100 text-gold-800 ring-gold-300" : "bg-surface text-navy ring-line-strong hover:ring-royal",
                        )}
                      >
                        {has(key) ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                        {sign.english}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <section aria-labelledby="library-title">
            <h2 id="library-title" className="eyebrow">
              ISLRTC signs
            </h2>
            <label className="relative mt-3 flex items-center">
              <span className="sr-only">Search ISLRTC signs</span>
              <Search className="pointer-events-none absolute left-3.5 size-4 text-ink-3" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 239 signs"
                className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-10 text-[0.9375rem] outline-none focus:border-royal"
              />
            </label>
            {!deferred && <p className="mt-2 text-xs text-ink-3">Showing signs from the lessons. Search to see all.</p>}
            <ul className="mt-3 flex flex-wrap gap-2">
              {results.map(({ gloss, english }) => (
                <li key={gloss}>
                  <button
                    type="button"
                    aria-pressed={has(gloss)}
                    onClick={() => toggle(gloss)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.875rem] font-medium ring-1 transition-colors",
                      has(gloss) ? "bg-brand-50 text-royal ring-brand-200" : "bg-surface text-navy ring-line-strong hover:ring-royal",
                    )}
                  >
                    {has(gloss) ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                    {english}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 mt-10 flex flex-wrap items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-md)] ring-1 ring-line md:bottom-4">
        <Button onClick={() => save()} leading={<Save aria-hidden />}>
          Save deck
        </Button>
        <Button variant="secondary" onClick={() => save((deck) => setSharing(deck))} leading={<Share2 aria-hidden />}>
          Save and share
        </Button>
        <Button variant="ghost" onClick={() => save((deck) => navigate(`/app/learn/decks/${deck.id}/lesson`))} leading={<GraduationCap aria-hidden />}>
          Try the lesson
        </Button>
      </div>
      {sharing && <ShareDeckDialog deck={sharing} open onClose={() => setSharing(null)} />}
    </div>
  );
}
