/** The cards for one place (a clinic, a bank, an emergency), ready to show. */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Plus, Trash2, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useCards } from "@/stores/cards";
import { AboutMeDialog, AddCardDialog, FillDialog } from "./CardDialogs";
import { CardScreen } from "./CardScreen";
import { DEAF_CARD, EMERGENCY, findPlace, type CardDef } from "./cardData";
import { SosPanel } from "./SosPanel";
import { missingDetail, useShowCard } from "./useShowCard";

export function CardTile({ card, onShow, danger, note, onRemove }: { card: CardDef; onShow: () => void; danger?: boolean; note?: string; onRemove?: () => void }) {
  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={onShow}
        className={cn(
          "press group flex h-full w-full flex-col items-start rounded-[1.75rem] p-5 text-left ring-1 transition-[background-color,box-shadow]",
          danger ? "bg-danger-bg ring-danger/25 hover:ring-danger" : "bg-surface ring-line hover:bg-sun-100 hover:ring-sun-400",
          onRemove && "pr-14",
        )}
      >
        <span className="text-[1.1875rem] leading-6 font-extrabold tracking-[-0.02em] text-navy">{card.en}</span>
        {card.hi && (
          <span lang="hi" className="mt-1.5 text-[0.9375rem] leading-6 text-ink-2">
            {card.hi}
          </span>
        )}
        {note && <span className="mt-3 rounded-full bg-paper-2 px-2.5 py-1 text-xs font-bold text-ink-2">{note}</span>}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove card "${card.en}"`}
          className="press absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function PlacePage() {
  const { placeId } = useParams();
  const place = findPlace(placeId);
  useDocumentTitle(place ? `${place.title} cards` : "Cards");
  const profile = useCards((s) => s.profile);
  const custom = useCards((s) => s.custom).filter((c) => c.placeId === placeId);
  const removeCard = useCards((s) => s.removeCard);
  const cards = useShowCard(placeId ?? "");
  const [about, setAbout] = useState<{ focus?: "contactName" | "allergies" | "medicines" | "conditions" } | null>(null);
  const [adding, setAdding] = useState(false);

  if (!place) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ArrowLeft />} title="No cards here" action={<ButtonLink to="/app/cards">All cards</ButtonLink>} />
      </div>
    );
  }

  const emergency = place.id === EMERGENCY.id;
  const Icon = place.icon;
  const list: CardDef[] = emergency ? place.cards : [DEAF_CARD, ...place.cards];

  const noteFor = (card: CardDef) => {
    if (card.fill) return `Add: ${card.fill.label.toLowerCase()}`;
    if (card.profile && missingDetail(card, profile)) return "Add your details first";
    if (card.profile) return "Uses your details";
    return undefined;
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/cards" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> All cards
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={cn("inline-flex size-14 shrink-0 items-center justify-center rounded-full", emergency ? "bg-danger text-white" : "bg-sun-400 text-navy")}>
            <Icon className="size-6" aria-hidden />
          </span>
          <div>
            <p className="eyebrow">{place.hint}</p>
            <h1 className="text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[2.75rem]">{place.title}</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAbout({})}
          className="press inline-flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-[0.9375rem] font-bold text-navy ring-1 ring-line hover:bg-sun-100"
        >
          <UserRound className="size-4" aria-hidden /> About me
        </button>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
        Tap a card and show your screen. The other person can tap a reply, type or speak, and you see it as big text or in sign.
      </p>

      {emergency && (
        <div className="mt-8">
          <SosPanel onAddContact={() => setAbout({ focus: "contactName" })} />
        </div>
      )}

      {place.id === "hospital" && (
        <Link
          to="/app/cards/visit"
          className="group mt-8 flex flex-wrap items-center gap-4 rounded-[1.75rem] bg-navy p-5 text-white transition-colors hover:bg-cobalt-500 sm:p-6"
        >
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy">
            <ClipboardList className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold">Seeing a doctor? Prepare a visit card</span>
            <span className="block text-[0.9375rem] text-white/75">Symptoms, medicines and questions written once, shown or shared at the desk.</span>
          </span>
        </Link>
      )}

      <section aria-labelledby="cards-title" className="mt-10">
        <h2 id="cards-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">
          {emergency ? "Show someone nearby" : "Cards"}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((card) => (
            <li key={card.id}>
              <CardTile
                card={card}
                danger={emergency && (card.id === "help" || card.id === "ambulance" || card.id === "police")}
                note={noteFor(card)}
                onShow={() => cards.show(card)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mine-title" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="mine-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">My cards</h2>
            <p className="mt-1 text-[0.9375rem] text-ink-3">Things you often need to say here. Saved on this device.</p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="press inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-[0.9375rem] font-bold text-white hover:bg-cobalt-500"
          >
            <Plus className="size-4" aria-hidden /> Add a card
          </button>
        </div>
        {custom.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((card) => (
              <li key={card.id}>
                <CardTile card={card} onShow={() => cards.show(card)} onRemove={() => removeCard(card.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CardScreen card={cards.shown} placeTitle={place.title} replies={place.replies} tone={emergency ? "danger" : "sun"} onClose={() => cards.setShown(null)} />
      <FillDialog
        open={cards.filling !== null}
        title={cards.filling?.en ?? ""}
        label={cards.filling?.fill?.label ?? ""}
        placeholder={cards.filling?.fill?.placeholder ?? ""}
        onClose={() => cards.setFilling(null)}
        onShow={cards.showFilled}
      />
      <AboutMeDialog
        open={about !== null || cards.needs !== null}
        focus={cards.needs?.field ?? about?.focus}
        onClose={() => {
          setAbout(null);
          cards.afterDetails();
        }}
      />
      <AddCardDialog open={adding} placeId={place.id} placeTitle={place.title} onClose={() => setAdding(false)} />
    </div>
  );
}
