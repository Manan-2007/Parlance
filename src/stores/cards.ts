/**
 * Cards: the user's "About me" details, their own cards, and the visit card
 * they are preparing. Saved in this browser only (localStorage); nothing is
 * sent anywhere unless the user shares a visit card or sends an SOS message.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createId } from "@/lib/id";
import { EMPTY_PROFILE, EMPTY_VISIT, type Profile, type VisitCard } from "@/lib/visitCard";

export interface CustomCard {
  id: string;
  placeId: string;
  en: string;
  hi: string;
}

interface CardsState {
  profile: Profile;
  custom: CustomCard[];
  visit: VisitCard;
  /** Cards shown most recently, newest first, as "placeId/cardId". */
  recent: string[];
}

interface CardsStore extends CardsState {
  setProfile: (patch: Partial<Profile>) => void;
  addCard: (placeId: string, en: string, hi: string) => void;
  removeCard: (id: string) => void;
  setVisit: (patch: Partial<VisitCard>) => void;
  clearVisit: () => void;
  markShown: (key: string) => void;
}

export const useCards = create<CardsStore>()(
  persist(
    (set) => ({
      profile: EMPTY_PROFILE,
      custom: [],
      visit: EMPTY_VISIT,
      recent: [],
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      addCard: (placeId, en, hi) =>
        set((s) => ({ custom: [...s.custom, { id: createId(), placeId, en: en.trim().slice(0, 200), hi: hi.trim().slice(0, 200) }] })),
      removeCard: (id) => set((s) => ({ custom: s.custom.filter((c) => c.id !== id) })),
      setVisit: (patch) => set((s) => ({ visit: { ...s.visit, ...patch, updatedAt: Date.now() } })),
      clearVisit: () => set({ visit: EMPTY_VISIT }),
      markShown: (key) => set((s) => ({ recent: [key, ...s.recent.filter((k) => k !== key)].slice(0, 6) })),
    }),
    {
      name: "parlance.cards.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ profile, custom, visit, recent }) => ({ profile, custom, visit, recent }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CardsState>;
        return {
          ...current,
          ...p,
          profile: { ...EMPTY_PROFILE, ...p.profile },
          visit: { ...EMPTY_VISIT, ...p.visit, needs: { ...EMPTY_VISIT.needs, ...p.visit?.needs } },
        };
      },
    },
  ),
);
