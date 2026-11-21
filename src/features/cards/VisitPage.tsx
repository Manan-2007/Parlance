/**
 * Visit card: prepared before an appointment, then shown at the desk or
 * shared with staff by QR code or link (the card travels inside the link).
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Copy, Eye, GraduationCap, Printer, QrCode as QrIcon, RotateCcw, UserRound } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { QrCode } from "@/components/ui/QrCode";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { toast } from "@/components/ui/Toaster";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { decodeVisit, encodeVisit, visitHasContent, type VisitCard } from "@/lib/visitCard";
import { useCards } from "@/stores/cards";
import { TextField } from "./CardDialogs";
import { CardScreen } from "./CardScreen";
import { PLACES } from "./cardData";
import { VisitCardView, visitRows } from "./VisitCardView";

const HOSPITAL = PLACES.find((p) => p.id === "hospital")!;
/** Above this, a QR code gets too dense for a phone camera at a desk. */
const QR_LIMIT = 1800;

function visitLink(encoded: string): string {
  return `${location.origin}/app/cards/visit/view#${encoded}`;
}

function ShareDialog({ card, open, onClose }: { card: VisitCard; open: boolean; onClose: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setLink(null);
    void encodeVisit(card).then((encoded) => live && setLink(visitLink(encoded)));
    return () => {
      live = false;
    };
  }, [card, open]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied");
    } catch {
      toast("Couldn't copy: select the link and copy it");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Share with staff"
      description="They scan the code or open the link and see your visit card on their screen. The card travels inside the link; Parlance has no server that stores it."
      footer={
        <>
          <Button variant="secondary" onClick={() => link && window.open(link, "_blank", "noopener")} disabled={!link} leading={<Printer aria-hidden />}>
            Open to print
          </Button>
          <Button onClick={copy} disabled={!link} leading={<Copy aria-hidden />}>
            Copy link
          </Button>
        </>
      }
    >
      {!link ? (
        <div className="grid h-56 place-items-center">
          <SigningLoader label="Preparing the code" />
        </div>
      ) : link.length <= QR_LIMIT ? (
        <div className="mx-auto w-full max-w-[16rem] overflow-hidden rounded-[1.25rem] ring-1 ring-line">
          <QrCode value={link} label="QR code that opens your visit card" />
        </div>
      ) : (
        <p className="rounded-[1rem] bg-sun-100 px-4 py-3 text-sm leading-6 text-ink-2">
          This card is too long for a QR code a phone can read. Copy the link and send it, or shorten the longest answers.
        </p>
      )}
      <label className="mt-4 block">
        <span className="sr-only">Visit card link</span>
        <input readOnly value={link ?? "Preparing…"} onFocus={(e) => e.currentTarget.select()} className="h-11 w-full rounded-md border border-line-strong bg-subtle px-3 text-sm text-ink-2" />
      </label>
      <p className="mt-2 text-xs leading-5 text-ink-3">Anyone with the link can read the card, so share it only with the people treating you.</p>
    </Dialog>
  );
}

export function VisitPage() {
  useDocumentTitle("Visit card");
  const visit = useCards((s) => s.visit);
  const profile = useCards((s) => s.profile);
  const setVisit = useCards((s) => s.setVisit);
  const clearVisit = useCards((s) => s.clearVisit);
  const [showing, setShowing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const card: VisitCard = { ...visit, name: visit.name || profile.name };
  const ready = visitHasContent(card);

  const field = (key: "place" | "reason" | "since" | "symptoms" | "medicines" | "allergies" | "questions") => (value: string) => setVisit({ [key]: value });
  const canFillFromProfile = Boolean((profile.medicines && !visit.medicines) || (profile.allergies && !visit.allergies));

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/cards/hospital" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Hospital or clinic cards
      </Link>
      <div className="mt-4 max-w-3xl">
        <p className="eyebrow">Before an appointment</p>
        <h1 className="mt-1 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[2.75rem]">Visit card</h1>
        <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
          Write it at home, at your own pace. At the desk, show it full screen or let staff scan it onto their phone, so nobody has to guess.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <form className="grid gap-5 rounded-[2rem] bg-surface p-5 ring-1 ring-line sm:p-7" onSubmit={(e) => e.preventDefault()}>
          <TextField label="Where are you going?" placeholder="For example: Dr Rao, City Clinic" value={visit.place} onChange={field("place")} />
          <TextField label="Why are you going?" placeholder="For example: stomach pain" value={visit.reason} onChange={field("reason")} multiline />
          <TextField label="Since when?" placeholder="For example: 3 days" value={visit.since} onChange={field("since")} />
          <TextField label="Symptoms" placeholder="What you feel, and when it is worse" value={visit.symptoms} onChange={field("symptoms")} multiline />
          {canFillFromProfile && (
            <button
              type="button"
              onClick={() => setVisit({ medicines: visit.medicines || profile.medicines, allergies: visit.allergies || profile.allergies })}
              className="press -mb-2 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-cobalt-100 px-4 text-[0.8125rem] font-bold text-cobalt-800 hover:bg-cobalt-200"
            >
              <UserRound className="size-4" aria-hidden /> Fill medicines and allergies from About me
            </button>
          )}
          <TextField label="Medicines you take" placeholder="Name and dose" value={visit.medicines} onChange={field("medicines")} multiline />
          <TextField label="Allergies" placeholder="Or write: none" value={visit.allergies} onChange={field("allergies")} />
          <TextField label="Questions to ask" hint="One per line. Staff can answer them in writing." placeholder={"Is it serious?\nWhen should I come back?"} value={visit.questions} onChange={field("questions")} multiline />
          <fieldset className="grid gap-2">
            <legend className="text-[0.9375rem] font-bold text-navy">How should staff talk with you?</legend>
            {(
              [
                ["write", "Write things down for me"],
                ["interpreter", "Arrange an ISL interpreter if possible"],
                ["visual", "Show me, point, or use pictures"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[1rem] bg-paper-50 px-4 ring-1 ring-line has-[:checked]:bg-sun-100 has-[:checked]:ring-sun-400">
                <input
                  type="checkbox"
                  checked={visit.needs[key]}
                  onChange={(e) => setVisit({ needs: { ...visit.needs, [key]: e.target.checked } })}
                  className="size-5 accent-navy"
                />
                <span className="text-[0.9375rem] font-semibold text-ink">{label}</span>
              </label>
            ))}
          </fieldset>
        </form>

        <div className="grid gap-4 lg:sticky lg:top-24">
          <VisitCardView card={card} />
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => setShowing(true)} disabled={!ready} leading={<Eye aria-hidden />}>
              Show at the desk
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setSharing(true)} disabled={!ready} leading={<QrIcon aria-hidden />}>
              Share
            </Button>
            {ready && (
              <Button variant="ghost" onClick={() => setConfirmClear(true)} leading={<RotateCcw aria-hidden />}>
                Start over
              </Button>
            )}
          </div>
          <p className="text-sm leading-5 text-ink-3">Saved on this device as you type.</p>
        </div>
      </div>

      <CardScreen
        card={showing ? { en: "I am Deaf. This is my visit card.", hi: "मैं बधिर हूँ। यह मेरा विज़िट कार्ड है।", list: visitRows(card) } : null}
        placeTitle="Visit card"
        replies={HOSPITAL.replies}
        onClose={() => setShowing(false)}
      />
      <ShareDialog card={card} open={sharing} onClose={() => setSharing(false)} />
      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearVisit();
          setConfirmClear(false);
        }}
        title="Start a new visit card?"
        description="This clears what you wrote. Your About me details stay."
        confirmLabel="Clear the card"
      />
    </div>
  );
}

/** What staff see when they scan the QR code or open the link. */
export function SharedVisitPage() {
  useDocumentTitle("Visit card");
  const { hash } = useLocation();
  const [state, setState] = useState<{ status: "loading" } | { status: "ok"; card: VisitCard } | { status: "bad" }>({ status: "loading" });

  useEffect(() => {
    let live = true;
    void decodeVisit(hash.replace(/^#/, "")).then((card) => live && setState(card ? { status: "ok", card } : { status: "bad" }));
    return () => {
      live = false;
    };
  }, [hash]);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <SigningLoader label="Opening the visit card" />
      </div>
    );
  }
  if (state.status === "bad") {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<QrIcon />} title="This link has no visit card" action={<ButtonLink to="/app/cards">Cards</ButtonLink>}>
          Ask for the code or link again; part of it may be missing.
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <p className="eyebrow print:hidden">Shared with you</p>
      <h1 className="mt-1 text-[2rem] leading-[1.1] font-extrabold tracking-[-0.04em] text-navy print:hidden">A patient's visit card</h1>
      <p className="mt-2 text-[1.0625rem] leading-7 text-ink-2 print:hidden">
        Face the person when you communicate, write your answers clearly, and check they have understood. This card is not stored anywhere.
      </p>
      <VisitCardView card={state.card} className="mt-6" />
      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        <Button variant="secondary" onClick={() => window.print()} leading={<Printer aria-hidden />}>
          Print
        </Button>
        <ButtonLink to="/app/learn/work/clinic" variant="ghost" leading={<GraduationCap aria-hidden />}>
          Learn signs for clinic staff
        </ButtonLink>
      </div>
    </div>
  );
}
