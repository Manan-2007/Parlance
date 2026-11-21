/**
 * Cards: for the moments a Deaf person needs to be understood quickly by
 * someone who doesn't sign: an emergency, a counter, a clinic visit.
 * Everything here works without a connection.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Siren, UserRound, WifiOff } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { visitHasContent } from "@/lib/visitCard";
import { useCards } from "@/stores/cards";
import { InstallAppButton } from "@/app/pwa";
import { AboutMeDialog } from "./CardDialogs";
import { CardScreen } from "./CardScreen";
import { EMERGENCY, PLACES, findPlace } from "./cardData";
import { medicalList, useShowCard } from "./useShowCard";

function Recent() {
  const recent = useCards((s) => s.recent);
  const custom = useCards((s) => s.custom);
  const items = recent
    .map((key) => {
      const [placeId, cardId] = key.split("/");
      const place = findPlace(placeId);
      const card = place?.cards.find((c) => c.id === cardId) ?? custom.find((c) => c.id === cardId);
      return place && card ? { key, place, card } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 4);
  const [placeId, setPlaceId] = useState("");
  const show = useShowCard(placeId);
  if (!items.length) return null;
  const place = findPlace(placeId);
  return (
    <section aria-labelledby="recent-title" className="mt-10">
      <h2 id="recent-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">Shown recently</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map(({ key, place, card }) => {
          const Icon = place.icon;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  setPlaceId(place.id);
                  show.show(card);
                }}
                className="press inline-flex min-h-12 items-center gap-2.5 rounded-full bg-surface py-2 pr-4 pl-2 text-left ring-1 ring-line hover:bg-sun-100 hover:ring-sun-400"
              >
                <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full", place.id === EMERGENCY.id ? "bg-danger text-white" : "bg-sun-400 text-navy")}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-[0.9375rem] leading-5 font-bold text-navy">{card.en}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <CardScreen card={show.shown} placeTitle={place?.title ?? ""} replies={place?.replies ?? []} tone={placeId === EMERGENCY.id ? "danger" : "sun"} onClose={() => show.setShown(null)} />
    </section>
  );
}

export function CardsPage() {
  useDocumentTitle("Cards");
  const profile = useCards((s) => s.profile);
  const visit = useCards((s) => s.visit);
  const [about, setAbout] = useState(false);
  const details = medicalList(profile).length;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">Cards</p>
        <h1 className="mt-1 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[3rem]">Be understood without signing.</h1>
        <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
          For counters, clinics and emergencies. Pick a place, tap a card and show your screen. The other person replies by tapping, typing or
          speaking, and you see their answer in big text or in sign.
        </p>
      </div>

      <Link
        to={`/app/cards/${EMERGENCY.id}`}
        className="group relative mt-8 flex flex-wrap items-center gap-5 overflow-hidden rounded-[2rem] bg-danger p-6 text-white transition-[filter] hover:brightness-110 sm:p-8"
      >
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full border-[20px] border-white/10" />
        <span className="relative inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-danger">
          <Siren className="size-7" aria-hidden />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block text-[1.75rem] leading-8 font-extrabold tracking-[-0.03em]">Emergency</span>
          <span className="mt-1 block text-[1rem] leading-6 text-white/85">
            Ask for help, an ambulance or the police, and send your location to your emergency contact.
          </span>
        </span>
        <ArrowRight className="relative size-6 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>

      <section aria-labelledby="places-title" className="mt-10">
        <h2 id="places-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">At a counter</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLACES.map((place) => {
            const Icon = place.icon;
            return (
              <li key={place.id}>
                <Link
                  to={`/app/cards/${place.id}`}
                  className="group flex h-full items-center gap-4 rounded-[1.75rem] bg-surface p-5 ring-1 ring-line transition-[background-color,box-shadow] hover:bg-sun-100 hover:ring-sun-400"
                >
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg leading-6 font-extrabold tracking-[-0.02em] text-navy">{place.title}</span>
                    <span className="block text-sm text-ink-3">
                      {place.hint} · {place.cards.length + 1} cards
                    </span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-navy" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="prepare-title" className="mt-10">
        <h2 id="prepare-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">Prepare ahead</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Link to="/app/cards/visit" className="group flex items-start gap-4 rounded-[1.75rem] bg-navy p-6 text-white transition-colors hover:bg-cobalt-500">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy">
              <ClipboardList className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-extrabold">Visit card</span>
              <span className="mt-1 block text-[0.9375rem] leading-6 text-white/75">
                {visitHasContent(visit)
                  ? `Ready${visit.place ? ` for ${visit.place}` : ""}. Show it at the desk or share it by QR code.`
                  : "Before a doctor's or office appointment: symptoms, medicines and questions, written once."}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setAbout(true)}
            className="press group flex items-start gap-4 rounded-[1.75rem] bg-surface p-6 text-left ring-1 ring-line hover:bg-sun-100 hover:ring-sun-400"
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-cobalt-100 text-cobalt-800">
              <UserRound className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-extrabold text-navy">About me</span>
              <span className="mt-1 block text-[0.9375rem] leading-6 text-ink-2">
                {details
                  ? `${details} detail${details === 1 ? "" : "s"} saved${profile.contactName ? ` · emergency contact: ${profile.contactName}` : ""}.`
                  : "Your emergency contact, allergies and medicines, so the right cards fill themselves in."}
              </span>
            </span>
          </button>
        </div>
      </section>

      <Recent />

      <aside className="mt-12 flex flex-wrap items-center gap-4 rounded-[1.75rem] bg-paper-2 p-5 sm:p-6">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-navy">
          <WifiOff className="size-5" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-[0.9375rem] leading-6 text-ink-2">
          <strong className="font-extrabold text-navy">Cards work without internet.</strong> Install Parlance on your phone's home screen to open them in
          one tap, even with no signal.
        </p>
        <InstallAppButton />
      </aside>

      <AboutMeDialog open={about} onClose={() => setAbout(false)} />
    </div>
  );
}
