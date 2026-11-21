/**
 * Teach: record signs and build decks for a class, a family or a workplace.
 */
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileUp, Layers, Mic2, Pencil, Play, Plus, Share2, Trash2, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { deckFromFile, type Deck } from "@/learn/decks";
import { anchorOf } from "@/learn/motion";
import { customKey, decodeFrames, type CustomSign } from "@/learn/recordings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDay } from "@/lib/time";
import { useSignLibrary } from "@/services/signs/library";
import { useTeach } from "@/stores/teach";
import { SignFigure } from "../learn/SignFigure";
import { ShareDeckDialog } from "./ShareDeckDialog";
import { readFile } from "./deckFiles";

function RecordingThumb({ sign }: { sign: CustomSign }) {
  const { frame, anchor } = useMemo(() => {
    const frames = decodeFrames(sign.frames);
    return { frame: frames[Math.floor(frames.length * 0.55)] ?? null, anchor: anchorOf(frames) };
  }, [sign.frames]);
  return <SignFigure frame={frame} anchor={anchor} className="h-full w-full" />;
}

export function TeachPage() {
  useDocumentTitle("Teach");
  const navigate = useNavigate();
  const library = useSignLibrary();
  const hydrated = useTeach((s) => s.hydrated);
  const recordings = useTeach((s) => s.recordings);
  const decks = useTeach((s) => s.decks);
  const author = useTeach((s) => s.author);
  const setAuthor = useTeach((s) => s.setAuthor);
  const removeRecording = useTeach((s) => s.removeRecording);
  const removeDeck = useTeach((s) => s.removeDeck);
  const saveDeck = useTeach((s) => s.saveDeck);
  const [deleting, setDeleting] = useState<{ kind: "recording" | "deck"; id: string; name: string } | null>(null);
  const [sharing, setSharing] = useState<Deck | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const ownDecks = decks.filter((d) => d.own);

  const importFile = async (file: File) => {
    try {
      const deck = deckFromFile(await readFile(file), library.available);
      if (!deck) throw new Error("invalid");
      saveDeck({ ...deck, own: false });
      toast(`Opened "${deck.title}"`);
      navigate(`/app/learn/decks/${deck.id}`);
    } catch {
      toast("That file isn't a Parlance deck");
    }
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Learn
      </Link>
      <div className="mt-4 grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow text-royal!">Teach</p>
          <h1 className="mt-3 max-w-3xl text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[3rem]">Teach the signs your people need.</h1>
          <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
            Record signs in your own hands, build a deck for your class, family or workplace, and share it as a link. Learners watch your recordings and
            practise against them with their camera.
          </p>
        </div>
        <label className="block w-full max-w-xs">
          <span className="text-sm font-medium text-ink-2">Credit my recordings and decks to</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal"
          />
        </label>
      </div>

      <section aria-label="Start" className="mt-8 grid gap-3 md:grid-cols-3">
        <Link to="/app/learn/teach/record" className="group rounded-2xl bg-navy p-6 text-white transition-colors hover:bg-[#0a2450]">
          <Video className="size-6 text-gold" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold text-white">Record a sign</h2>
          <p className="mt-1 text-sm leading-6 text-white/75">Sign it once to the camera. Hand positions only, never video.</p>
        </Link>
        <Link to="/app/learn/teach/decks/new" className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-royal/50">
          <Layers className="size-6 text-royal" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold text-navy group-hover:text-royal">Build a deck</h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">Pick ISLRTC signs and your recordings, add phrases, share it.</p>
        </Link>
        <button type="button" onClick={() => fileInput.current?.click()} className="group rounded-2xl border border-line bg-surface p-6 text-left transition-colors hover:border-royal/50">
          <FileUp className="size-6 text-royal" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold text-navy group-hover:text-royal">Open a deck file</h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">Someone sent you a .parlance-deck.json file? Open it here.</p>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
            e.target.value = "";
          }}
        />
      </section>

      <section aria-labelledby="recordings-title" className="mt-12">
        <h2 id="recordings-title" className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.03em] text-navy">
          <Mic2 className="size-5 text-royal" aria-hidden /> My recordings
        </h2>
        {!hydrated ? (
          <p className="mt-3 text-ink-3" role="status">Loading…</p>
        ) : recordings.length === 0 ? (
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-7 text-ink-2">
            Nothing recorded yet. Record the signs your learners need that aren't in the ISLRTC library: names, local places, your workplace's words, or the
            alphabet for fingerspelling practice.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recordings.map((sign) => (
              <li key={sign.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="aspect-[4/3] bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))]">
                  <RecordingThumb sign={sign} />
                </div>
                <div className="p-4">
                  <p className="flex items-center gap-2 font-semibold text-navy">
                    {sign.english}
                    {sign.letter && <Badge tone="gold">Letter {sign.letter}</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {sign.author ? `${sign.author} · ` : ""}
                    {formatDay(sign.createdAt)} · {(sign.count / sign.fps).toFixed(1)} s
                  </p>
                  <div className="mt-3 flex gap-1.5">
                    <ButtonLink to={`/app/learn/signs/${customKey(sign.id)}`} size="sm" variant="subtle" leading={<Play aria-hidden />}>
                      Open
                    </ButtonLink>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting({ kind: "recording", id: sign.id, name: sign.english })} leading={<Trash2 aria-hidden />}>
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="decks-title" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="decks-title" className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.03em] text-navy">
            <Layers className="size-5 text-royal" aria-hidden /> My decks
          </h2>
          <ButtonLink to="/app/learn/teach/decks/new" variant="secondary" size="sm" leading={<Plus aria-hidden />}>
            New deck
          </ButtonLink>
        </div>
        {hydrated && ownDecks.length === 0 ? (
          <p className="mt-2 text-[0.9375rem] leading-7 text-ink-2">No decks yet. A deck is a short lesson you design: a few signs, a few phrases.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
            {ownDecks.map((deck) => (
              <li key={deck.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                <Link to={`/app/learn/decks/${deck.id}`} className="min-w-0 flex-1">
                  <span className="block font-semibold text-navy hover:text-royal">{deck.title}</span>
                  <span className="block text-xs text-ink-3">
                    {deck.items.length} signs · {deck.phrases.length} phrases{deck.signs.length ? ` · ${deck.signs.length} recordings` : ""}
                  </span>
                </Link>
                <ButtonLink to={`/app/learn/teach/decks/${deck.id}`} size="sm" variant="ghost" leading={<Pencil aria-hidden />}>
                  Edit
                </ButtonLink>
                <Button size="sm" variant="subtle" onClick={() => setSharing(deck)} leading={<Share2 aria-hidden />}>
                  Share
                </Button>
                <button
                  type="button"
                  aria-label={`Delete ${deck.title}`}
                  onClick={() => setDeleting({ kind: "deck", id: deck.id, name: deck.title })}
                  className="inline-flex size-9 items-center justify-center rounded-full text-ink-3 hover:bg-subtle hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sharing && <ShareDeckDialog deck={sharing} open onClose={() => setSharing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting?.kind === "recording") removeRecording(deleting.id);
          if (deleting?.kind === "deck") removeDeck(deleting.id);
          toast(`Deleted "${deleting?.name}"`);
          setDeleting(null);
        }}
        title={deleting?.kind === "deck" ? "Delete this deck?" : "Delete this recording?"}
        description={
          deleting?.kind === "deck"
            ? `"${deleting.name}" is removed from this browser. Copies you already shared keep working.`
            : `"${deleting?.name}" is removed from this browser. Decks that already include it keep their own copy.`
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
