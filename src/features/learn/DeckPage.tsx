/**
 * A saved deck, and the landing page for a shared deck link (#fragment).
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Download, Layers, Pencil, Share2, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toaster";
import { decodeDeck, type Deck } from "@/learn/decks";
import { isCustomKey } from "@/learn/recordings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { useTeach } from "@/stores/teach";
import { downloadDeck } from "../teach/deckFiles";
import { ShareDeckDialog } from "../teach/ShareDeckDialog";
import { englishOf } from "./signData";

function DeckSummary({ deck, label }: { deck: Deck; label: (key: string) => string }) {
  const custom = deck.signs.length > 0;
  return (
    <>
      <div className="flex items-start gap-4">
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-royal">
          <Layers className="size-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[2.75rem]">{deck.title}</h1>
          <p className="mt-2 text-[1.0625rem] leading-7 text-ink-2">
            {deck.description ?? "A deck of signs and phrases."}
            {deck.author && <span className="text-ink-3"> · by {deck.author}</span>}
          </p>
        </div>
      </div>
      {custom && (
        <p className="mt-5 flex max-w-2xl items-start gap-2.5 rounded-xl bg-gold-50 px-4 py-3 text-sm leading-6 text-ink-2 ring-1 ring-gold-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-800" aria-hidden />
          {deck.signs.length} sign{deck.signs.length === 1 ? " was" : "s were"} recorded by the deck's author, not taken from the ISLRTC dictionary, and
          nobody has reviewed {deck.signs.length === 1 ? "it" : "them"}.
        </p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="deck-signs">
          <h2 id="deck-signs" className="eyebrow">
            {deck.items.length} signs
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {deck.items.map((key) => (
              <li key={key}>
                <Link
                  to={`/app/learn/signs/${key}`}
                  className="inline-flex h-9 items-center rounded-full bg-surface px-3.5 text-[0.8125rem] font-semibold tracking-[0.04em] text-navy uppercase ring-1 ring-line-strong hover:ring-royal"
                >
                  {label(key)}
                  {isCustomKey(key) && <span className="ml-1.5 normal-case tracking-normal text-gold-800">· recorded</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {deck.phrases.length > 0 && (
          <section aria-labelledby="deck-phrases">
            <h2 id="deck-phrases" className="eyebrow">
              Phrases
            </h2>
            <ul className="mt-3 space-y-2">
              {deck.phrases.map((phrase, i) => (
                <li key={`${phrase.english}-${i}`} className="rounded-xl border border-line bg-surface px-4 py-3">
                  <p className="font-medium text-ink">{phrase.english}</p>
                  <p className="mt-0.5 text-[0.8125rem] font-semibold tracking-[0.05em] text-navy uppercase">{phrase.items.map(label).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

export function DeckPage() {
  const { deckId = "" } = useParams();
  const navigate = useNavigate();
  const library = useSignLibrary();
  const hydrated = useTeach((s) => s.hydrated);
  const deck = useTeach((s) => s.decks.find((d) => d.id === deckId));
  const removeDeck = useTeach((s) => s.removeDeck);
  const record = useLearn((s) => s.lessons[`deck/${deckId}`]);
  const [sharing, setSharing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useDocumentTitle(deck?.title ?? "Deck");

  if (!hydrated) return <p className="container-page py-16 text-center text-ink-3" role="status">Loading…</p>;
  if (!deck) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<Layers />} title="Deck not found" action={<ButtonLink to="/app/learn">Back to Learn</ButtonLink>}>
          It may have been deleted from this browser. Open the link or file again to get it back.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Learn
      </Link>
      <div className="mt-4">
        <DeckSummary deck={deck} label={(key) => englishOf(key, library)} />
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
        <ButtonLink to={`/app/learn/decks/${deck.id}/lesson`} trailing={<ArrowRight aria-hidden />}>
          {record ? "Practise again" : "Start the lesson"}
        </ButtonLink>
        <Button variant="secondary" onClick={() => setSharing(true)} leading={<Share2 aria-hidden />}>
          Share
        </Button>
        <Button variant="ghost" onClick={() => downloadDeck(deck)} leading={<Download aria-hidden />}>
          Download
        </Button>
        {deck.own ? (
          <ButtonLink to={`/app/learn/teach/decks/${deck.id}`} variant="ghost" leading={<Pencil aria-hidden />}>
            Edit
          </ButtonLink>
        ) : (
          <ButtonLink to={`/app/learn/teach/decks/${deck.id}`} variant="ghost" leading={<Pencil aria-hidden />}>
            Edit a copy
          </ButtonLink>
        )}
        <Button variant="ghost" onClick={() => setConfirm(true)} leading={<Trash2 aria-hidden />} className="ml-auto">
          Delete
        </Button>
        {record && <p className="w-full text-sm text-ink-3">Last done: {record.correct} of {record.total} right first time.</p>}
      </div>
      {sharing && <ShareDeckDialog deck={deck} open onClose={() => setSharing(false)} />}
      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          removeDeck(deck.id);
          toast(`Deleted "${deck.title}"`);
          navigate("/app/learn");
        }}
        title="Delete this deck?"
        description={`"${deck.title}" is removed from this browser. Anyone you shared it with keeps their copy.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

/** /app/learn/deck#<encoded deck> — preview a shared deck, then save it. */
export function SharedDeckPage() {
  useDocumentTitle("Shared deck");
  const { hash } = useLocation();
  const navigate = useNavigate();
  const library = useSignLibrary();
  const hydrated = useTeach((s) => s.hydrated);
  const saveDeck = useTeach((s) => s.saveDeck);
  const existing = useTeach((s) => s.decks);
  const [state, setState] = useState<{ status: "loading" } | { status: "invalid" } | { status: "ready"; deck: Deck }>({ status: "loading" });

  useEffect(() => {
    if (!library.loaded) return;
    let live = true;
    const text = hash.replace(/^#/, "");
    if (!text) {
      setState({ status: "invalid" });
      return;
    }
    void decodeDeck(text, library.available).then((deck) => {
      if (live) setState(deck ? { status: "ready", deck } : { status: "invalid" });
    });
    return () => {
      live = false;
    };
  }, [hash, library.loaded, library.available]);

  if (state.status === "loading" || !hydrated) return <p className="container-page py-16 text-center text-ink-3" role="status">Opening the deck…</p>;
  if (state.status === "invalid") {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<AlertTriangle />} title="This link doesn't contain a deck" action={<ButtonLink to="/app/learn">Go to Learn</ButtonLink>}>
          The link may have been cut short when it was sent. Ask for the deck file instead, and open it from Teach.
        </EmptyState>
      </div>
    );
  }

  const { deck } = state;
  const already = existing.some((d) => d.id === deck.id);
  const keep = (start: boolean) => {
    saveDeck({ ...deck, own: existing.find((d) => d.id === deck.id)?.own ?? false });
    toast(`Saved "${deck.title}"`);
    navigate(start ? `/app/learn/decks/${deck.id}/lesson` : `/app/learn/decks/${deck.id}`, { replace: true });
  };
  const label = (key: string) => (isCustomKey(key) ? deck.signs.find((s) => `rec:${s.id}` === key)?.english ?? "recording" : englishOf(key, library));

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow text-royal!">Shared with you</p>
      <div className="mt-4">
        <DeckSummary deck={deck} label={label} />
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
        <Button onClick={() => keep(true)} trailing={<ArrowRight aria-hidden />}>
          Save and start
        </Button>
        <Button variant="secondary" onClick={() => keep(false)}>
          {already ? "Update my copy" : "Save to my decks"}
        </Button>
        <p className="w-full text-xs leading-5 text-ink-3">The deck is saved in this browser only. Nothing was sent anywhere to open it.</p>
      </div>
    </div>
  );
}
