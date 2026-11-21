/**
 * Turning a card definition into what the screen shows: filling blanks and
 * "About me" details, and asking for missing details first.
 */
import { useState } from "react";
import type { Profile } from "@/lib/visitCard";
import { useCards } from "@/stores/cards";
import type { ShownCard } from "./CardScreen";
import type { CardDef } from "./cardData";

export function medicalList(profile: Profile): { label: string; value: string }[] {
  return [
    { label: "Name", value: profile.name },
    { label: "Blood group", value: profile.bloodGroup },
    { label: "Conditions", value: profile.conditions },
    { label: "Allergies", value: profile.allergies },
    { label: "Medicines", value: profile.medicines },
    { label: "Emergency contact", value: [profile.contactName, profile.contactPhone].filter(Boolean).join(" · ") },
  ].filter((item) => item.value.trim());
}

/** The "About me" field a profile card needs, if it is still empty. */
export function missingDetail(card: CardDef, profile: Profile): keyof Profile | null {
  switch (card.profile) {
    case "contact":
      return profile.contactPhone.trim() ? null : "contactName";
    case "allergies":
      return profile.allergies.trim() ? null : "allergies";
    case "medicines":
      return profile.medicines.trim() ? null : "medicines";
    case "conditions":
      return medicalList(profile).length ? null : "conditions";
    default:
      return null;
  }
}

export function resolveCard(card: CardDef, profile: Profile, filled?: string): ShownCard {
  switch (card.profile) {
    case "contact":
      return { ...card, detail: [profile.contactName, profile.contactPhone].filter(Boolean).join(" · ") };
    case "allergies":
      return { ...card, detail: profile.allergies };
    case "medicines":
      return { ...card, detail: profile.medicines };
    case "conditions":
      return { ...card, list: medicalList(profile) };
    default:
      return filled ? { ...card, detail: filled } : { ...card };
  }
}

/**
 * State for showing cards on a page: which card is up, which blank is being
 * filled, and whether "About me" needs to be completed first.
 */
export function useShowCard(placeId: string) {
  const profile = useCards((s) => s.profile);
  const markShown = useCards((s) => s.markShown);
  const [shown, setShown] = useState<ShownCard | null>(null);
  const [filling, setFilling] = useState<CardDef | null>(null);
  const [needs, setNeeds] = useState<{ card: CardDef; field: keyof Profile } | null>(null);

  const show = (card: CardDef) => {
    const missing = missingDetail(card, profile);
    if (missing) {
      setNeeds({ card, field: missing });
      return;
    }
    if (card.fill) {
      setFilling(card);
      return;
    }
    markShown(`${placeId}/${card.id}`);
    setShown(resolveCard(card, profile));
  };

  const showFilled = (value: string) => {
    if (!filling) return;
    markShown(`${placeId}/${filling.id}`);
    setShown(resolveCard(filling, profile, value));
    setFilling(null);
  };

  /** After "About me" closes: show the card if its detail is now there. */
  const afterDetails = () => {
    const pending = needs;
    setNeeds(null);
    if (!pending) return;
    const latest = useCards.getState().profile;
    if (!missingDetail(pending.card, latest)) {
      markShown(`${placeId}/${pending.card.id}`);
      setShown(resolveCard(pending.card, latest));
    }
  };

  return { shown, setShown, show, filling, setFilling, showFilled, needs, afterDetails };
}
