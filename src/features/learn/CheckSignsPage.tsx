/**
 * Check signs: for fluent signers. Go through Parlance's signs (Remy's 3D
 * signs, its fingerspelling letters, ISLRTC recordings, teachers' recordings)
 * and mark each correct, a regional variant, or wrong. Share the checks as a
 * link or file; every learner who opens it sees the result beside the sign.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Copy, Download, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { toast } from "@/components/ui/Toaster";
import { curriculumGlosses } from "@/learn/curriculum";
import { customKey } from "@/learn/recordings";
import { decodePack, encodePack, avatarLetterKey, packFromFile, packToFile, avatarKey, type ReviewPack, type Verdict } from "@/learn/reviews";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { myPack, useTeach } from "@/stores/teach";
import { SUPPORTED_TOKENS, readableSignLabel } from "@/translation/islVocabulary.js";
import { OfficialVideo } from "./OfficialVideo";
import { ReferencePlayer } from "./ReferencePlayer";
import { ReviewBadge } from "./ReviewBadge";
import { capitalise, englishOf } from "./signData";

const RemyGuide = lazy(() => import("./RemyGuide"));
const SpellingAvatar = lazy(() => import("./SpellingAvatar"));

type SetId = "remy" | "letters" | "islrtc" | "recordings";
interface Item {
  key: string;
  english: string;
  kind: SetId;
  /** Remy token, letter, or ISLRTC gloss / recording key. */
  ref: string;
}

const VERDICT_TEXT: Record<SetId, Record<Verdict, string>> = {
  remy: { correct: "Correct", variant: "Regional variant", wrong: "Wrong" },
  letters: { correct: "Correct", variant: "Regional variant", wrong: "Wrong" },
  islrtc: { correct: "I sign it the same", variant: "I sign it differently", wrong: "Recording looks wrong" },
  recordings: { correct: "Correct", variant: "Regional variant", wrong: "Wrong" },
};

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ShareChecks({ pack, onClose }: { pack: ReviewPack; onClose: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void encodePack(pack).then((text) => live && setLink(`${window.location.origin}/app/learn/checks#${text}`));
    return () => {
      live = false;
    };
  }, [pack]);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Share your checks"
      description={`${pack.reviews.length} sign${pack.reviews.length === 1 ? "" : "s"} checked by ${pack.reviewer}. Anyone who opens the link sees your verdicts and notes beside each sign. Nothing is uploaded: the checks travel inside the link.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => download("parlance-sign-checks.json", packToFile(pack))} leading={<Download aria-hidden />}>
            Download file
          </Button>
          <Button
            disabled={!link}
            leading={<Copy aria-hidden />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link ?? "");
                toast("Link copied");
              } catch {
                toast("Couldn't copy: select the link and copy it");
              }
            }}
          >
            Copy link
          </Button>
        </>
      }
    >
      <input readOnly value={link ?? "Preparing…"} onFocus={(e) => e.currentTarget.select()} aria-label="Link to your checks" className="h-11 w-full rounded-md border border-line-strong bg-subtle px-3 text-sm text-ink-2" />
    </Dialog>
  );
}

function Viewer({ item }: { item: Item }) {
  const fallback = <div className="aspect-[4/3] animate-pulse rounded-2xl bg-sky-50" />;
  if (item.kind === "remy") {
    return (
      <Suspense fallback={fallback}>
        <RemyGuide token={item.ref} />
      </Suspense>
    );
  }
  if (item.kind === "letters") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200 sm:aspect-[16/11]">
        <Suspense fallback={fallback}>
          <LetterLoop letter={item.ref} />
        </Suspense>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <ReferencePlayer glosses={[item.ref]} label={`Recording of ${item.english}`} />
      {item.kind === "islrtc" && <OfficialVideo gloss={item.ref} english={item.english} />}
    </div>
  );
}

/** Replays a letter every couple of seconds so the reviewer can watch it repeatedly. */
function LetterLoop({ letter }: { letter: string }) {
  const [take, setTake] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTake((t) => t + 1), 2600);
    return () => window.clearInterval(id);
  }, []);
  return <SpellingAvatar word={letter} take={take} label={`The avatar fingerspelling ${letter}`} />;
}

export function CheckSignsPage() {
  useDocumentTitle("Check signs");
  const library = useSignLibrary();
  const teach = useTeach();
  const fileInput = useRef<HTMLInputElement>(null);
  const [set, setSet] = useState<SetId>("remy");
  const [onlyUnchecked, setOnlyUnchecked] = useState(true);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [note, setNote] = useState("");
  const [sharing, setSharing] = useState<ReviewPack | null>(null);

  const mine = useMemo(() => new Map(teach.myReviews.map((r) => [r.key, r])), [teach.myReviews]);
  const all = useMemo<Item[]>(() => {
    if (set === "remy") return SUPPORTED_TOKENS.map((t) => ({ key: avatarKey(t), english: readableSignLabel(t).toLowerCase(), kind: set, ref: t }));
    if (set === "letters") return [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => ({ key: avatarLetterKey(l), english: `letter ${l}`, kind: set, ref: l }));
    if (set === "islrtc") return curriculumGlosses().map((g) => ({ key: g, english: englishOf(g, library), kind: set, ref: g }));
    const recs = [...teach.recordings, ...teach.decks.flatMap((d) => d.signs)];
    const unique = [...new Map(recs.map((r) => [r.id, r])).values()];
    return unique.map((r) => ({ key: customKey(r.id), english: r.english, kind: set, ref: customKey(r.id) }));
  }, [set, library, teach.recordings, teach.decks]);
  // Freeze the list when the set or filter changes, so checking an item doesn't reshuffle it away.
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    setItems(onlyUnchecked ? all.filter((i) => !mine.has(i.key)) : all);
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, onlyUnchecked, all.length]);

  const item = items[index];
  useEffect(() => {
    const existing = item ? mine.get(item.key) : undefined;
    setVerdict(existing?.verdict ?? null);
    setNote(existing?.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.key]);

  const save = () => {
    if (!item || !verdict) return;
    teach.setReview(item.key, verdict, note);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "TEXTAREA" || (event.target as HTMLElement)?.tagName === "INPUT") return;
      if (event.key === "1") setVerdict("correct");
      if (event.key === "2") setVerdict("variant");
      if (event.key === "3") setVerdict("wrong");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const importFile = async (file: File) => {
    try {
      if (file.size > 2_000_000) throw new Error("too large");
      const pack = packFromFile(await file.text());
      if (!pack) throw new Error("invalid");
      teach.saveReviewPack(pack);
      toast(`Added checks by ${pack.reviewer}`);
    } catch {
      toast("That file isn't a set of Parlance sign checks");
    }
  };

  const checkedInSet = all.filter((i) => mine.has(i.key)).length;
  const pack = myPack(teach);

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Learn
      </Link>
      <div className="mt-4 grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow text-royal!">For fluent signers</p>
          <h1 className="mt-3 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[3rem]">Check Parlance's signs</h1>
          <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
            Parlance's 3D signs, letters and teacher recordings have not been checked by a fluent signer. If you sign ISL, mark each one, then share your checks. Reviewer identity and fluency are self-reported.
            Learners will see your verdict and notes beside the sign.
          </p>
        </div>
        <div className="grid w-full max-w-sm gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-2">Your name</span>
            <input value={teach.author} onChange={(e) => teach.setAuthor(e.target.value)} placeholder="Shown with your checks" className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-2">Where you sign</span>
            <input value={teach.region} onChange={(e) => teach.setRegion(e.target.value)} placeholder="e.g. Delhi" className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal" />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Segmented<SetId>
          label="Signs to check"
          value={set}
          onChange={setSet}
          options={[
            { value: "remy", label: "3D signs" },
            { value: "letters", label: "Letters" },
            { value: "islrtc", label: "ISLRTC" },
            { value: "recordings", label: "Recordings" },
          ]}
        />
        <label className="inline-flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={onlyUnchecked} onChange={(e) => setOnlyUnchecked(e.target.checked)} />
          Only ones I haven't checked
        </label>
        <span className="ml-auto text-sm font-medium text-ink-3 tabular-nums">
          {checkedInSet}/{all.length} checked
        </span>
      </div>

      {!teach.hydrated ? (
        <p className="mt-10 text-ink-3" role="status">Loading…</p>
      ) : !item ? (
        <EmptyState icon={<ShieldCheck />} title={all.length ? "All checked in this set" : "Nothing to check here"} className="mt-6">
          {all.length ? "Thank you. Share your checks so learners can see them, or pick another set." : "There are no recordings on this device or in your decks yet."}
        </EmptyState>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
          <Viewer key={item.key} item={item} />
          <div>
            <p className="eyebrow">
              {index + 1} of {items.length}
            </p>
            <h2 className="mt-2 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.04em] text-navy">{capitalise(item.english)}</h2>
            <ReviewBadge reviewKey={item.key} className="mt-3" />
            <div className="mt-6 grid gap-2" role="radiogroup" aria-label="Your verdict">
              {(["correct", "variant", "wrong"] as Verdict[]).map((v, i) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={verdict === v}
                  onClick={() => setVerdict(v)}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-[1rem] font-medium transition-colors",
                    verdict === v
                      ? v === "correct"
                        ? "border-success bg-success-bg text-success"
                        : v === "variant"
                          ? "border-royal bg-brand-50 text-royal"
                          : "border-danger bg-danger-bg text-danger"
                      : "border-line-strong bg-surface text-navy hover:border-royal",
                  )}
                >
                  {VERDICT_TEXT[item.kind][v]}
                  <kbd className="text-xs font-normal text-ink-3">{i + 1}</kbd>
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-ink-2">Note for learners {verdict && verdict !== "correct" ? "(what's different?)" : "(optional)"}</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                rows={2}
                placeholder={item.kind === "letters" ? "e.g. thumb should rest on the palm" : "e.g. palm should face down; in Mumbai we sign it at the chin"}
                className="mt-1.5 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[0.9375rem] outline-none focus:border-royal"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={save} disabled={!verdict} trailing={<ArrowRight aria-hidden />}>
                Save and next
              </Button>
              <Button variant="ghost" onClick={() => setIndex((i) => i + 1)}>
                Skip
              </Button>
              {index > 0 && (
                <Button variant="ghost" onClick={() => setIndex((i) => i - 1)}>
                  Back
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-ink-3">Keys 1, 2, 3 pick a verdict.</p>
          </div>
        </div>
      )}

      <section aria-labelledby="share-title" className="mt-12 grid gap-4 rounded-2xl bg-sky-50 p-5 ring-1 ring-sky-200 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <h2 id="share-title" className="font-semibold text-navy">
            Your checks: {teach.myReviews.length}
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">
            Saved in this browser. Share them as a link or file with the people you teach, or with whoever maintains Parlance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => pack && setSharing(pack)} disabled={!pack}>
            Share my checks
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()} leading={<FileUp aria-hidden />}>
            Add someone's checks
          </Button>
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
        </div>
      </section>

      {teach.reviewPacks.length > 0 && (
        <section aria-labelledby="received-title" className="mt-8">
          <h2 id="received-title" className="eyebrow">
            Checks from other signers
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
            {teach.reviewPacks.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">
                    {p.reviewer}
                    {p.region ? ` · ${p.region}` : ""}
                  </span>
                  <span className="block text-xs text-ink-3">
                    {p.reviews.length} checks · {p.reviews.filter((r) => r.verdict === "wrong").length} flagged
                  </span>
                </span>
                <button type="button" aria-label={`Remove checks by ${p.reviewer}`} onClick={() => teach.removeReviewPack(p.id)} className="inline-flex size-9 items-center justify-center rounded-full text-ink-3 hover:bg-subtle hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sharing && <ShareChecks pack={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}

/** /app/learn/checks#<packed> — someone's shared sign checks. */
export function SharedChecksPage() {
  useDocumentTitle("Shared sign checks");
  const { hash } = useLocation();
  const navigate = useNavigate();
  const saveReviewPack = useTeach((s) => s.saveReviewPack);
  const hydrated = useTeach((s) => s.hydrated);
  const [state, setState] = useState<{ status: "loading" } | { status: "invalid" } | { status: "ready"; pack: ReviewPack }>({ status: "loading" });

  useEffect(() => {
    let live = true;
    void decodePack(hash.replace(/^#/, "")).then((pack) => live && setState(pack ? { status: "ready", pack } : { status: "invalid" }));
    return () => {
      live = false;
    };
  }, [hash]);

  if (state.status === "loading" || !hydrated) return <p className="container-page py-16 text-center text-ink-3" role="status">Opening…</p>;
  if (state.status === "invalid") {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<AlertTriangle />} title="This link doesn't contain sign checks" action={<ButtonLink to="/app/learn">Go to Learn</ButtonLink>}>
          It may have been cut short. Ask for the file instead.
        </EmptyState>
      </div>
    );
  }
  const { pack } = state;
  const count = (v: Verdict) => pack.reviews.filter((r) => r.verdict === v).length;
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <p className="eyebrow text-royal!">Shared with you</p>
      <h1 className="mt-3 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em]">Sign checks by {pack.reviewer}</h1>
      <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
        {pack.reviews.length} sign{pack.reviews.length === 1 ? "" : "s"} checked{pack.region ? ` by a signer from ${pack.region}` : ""}: {count("correct")} correct,{" "}
        {count("variant")} regional variant{count("variant") === 1 ? "" : "s"}, {count("wrong")} flagged as wrong. Add them and Parlance shows these verdicts beside each sign.
      </p>
      <p className="mt-3 text-sm text-ink-3">Only add checks from someone you trust to sign ISL well.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            saveReviewPack(pack);
            toast(`Added checks by ${pack.reviewer}`);
            navigate("/app/learn/check-signs", { replace: true });
          }}
        >
          Add these checks
        </Button>
        <ButtonLink to="/app/learn" variant="secondary">
          Not now
        </ButtonLink>
      </div>
    </div>
  );
}
