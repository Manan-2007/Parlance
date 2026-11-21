/**
 * Teach: signs recorded on this device and lesson decks (made here or
 * received). Stored in IndexedDB; nothing leaves the device unless the user
 * shares a deck.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Deck } from "@/learn/decks";
import { customId, isCustomKey, type CustomSign } from "@/learn/recordings";
import type { ReviewPack, SignReview, Verdict } from "@/learn/reviews";
import { createId } from "@/lib/id";
import { idbStorage } from "@/lib/idbStorage";

interface TeachState {
  recordings: CustomSign[];
  decks: Deck[];
  /** Name to credit on new recordings and decks. */
  author: string;
  /** This device's own sign checks, shared as a ReviewPack. */
  myReviews: SignReview[];
  myReviewId: string;
  region: string;
  /** Checks received from other reviewers. */
  reviewPacks: ReviewPack[];
  hydrated: boolean;
}

interface TeachStore extends TeachState {
  addRecording: (sign: CustomSign) => void;
  updateRecording: (id: string, patch: Partial<Pick<CustomSign, "english" | "letter" | "notes" | "author">>) => void;
  removeRecording: (id: string) => void;
  saveDeck: (deck: Deck) => void;
  removeDeck: (id: string) => void;
  setAuthor: (author: string) => void;
  setRegion: (region: string) => void;
  setReview: (key: string, verdict: Verdict, note?: string) => void;
  clearReview: (key: string) => void;
  saveReviewPack: (pack: ReviewPack) => void;
  removeReviewPack: (id: string) => void;
}

export const useTeach = create<TeachStore>()(
  persist(
    (set, get) => ({
      recordings: [],
      decks: [],
      author: "",
      myReviews: [],
      myReviewId: createId(),
      region: "",
      reviewPacks: [],
      hydrated: false,
      addRecording: (sign) => set({ recordings: [sign, ...get().recordings.filter((r) => r.id !== sign.id)] }),
      updateRecording: (id, patch) => set({ recordings: get().recordings.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),
      removeRecording: (id) => set({ recordings: get().recordings.filter((r) => r.id !== id) }),
      saveDeck: (deck) => {
        const others = get().decks.filter((d) => d.id !== deck.id);
        set({ decks: [deck, ...others] });
      },
      removeDeck: (id) => set({ decks: get().decks.filter((d) => d.id !== id) }),
      setAuthor: (author) => set({ author: author.slice(0, 40) }),
      setRegion: (region) => set({ region: region.slice(0, 40) }),
      setReview: (key, verdict, note) =>
        set({ myReviews: [{ key, verdict, note: note?.trim().slice(0, 200) || undefined, at: Date.now() }, ...get().myReviews.filter((r) => r.key !== key)] }),
      clearReview: (key) => set({ myReviews: get().myReviews.filter((r) => r.key !== key) }),
      saveReviewPack: (pack) => set({ reviewPacks: [pack, ...get().reviewPacks.filter((p) => p.id !== pack.id)] }),
      removeReviewPack: (id) => set({ reviewPacks: get().reviewPacks.filter((p) => p.id !== id) }),
    }),
    {
      name: "parlance.teach.v1",
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ recordings, decks, author, myReviews, myReviewId, region, reviewPacks }) => ({ recordings, decks, author, myReviews, myReviewId, region, reviewPacks }),
      onRehydrateStorage: () => () => useTeach.setState({ hydrated: true }),
    },
  ),
);

/** Resolves once saved recordings and decks have loaded. */
export function teachReady(): Promise<void> {
  if (useTeach.getState().hydrated) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = useTeach.subscribe((state) => {
      if (state.hydrated) {
        stop();
        resolve();
      }
    });
  });
}

/** A recording by key ("rec:<id>"), from this device's recordings or any saved deck. */
export function findCustomSign(key: string, state: Pick<TeachState, "recordings" | "decks"> = useTeach.getState()): CustomSign | undefined {
  if (!isCustomKey(key)) return undefined;
  const id = customId(key);
  return state.recordings.find((r) => r.id === id) ?? state.decks.flatMap((d) => d.signs).find((s) => s.id === id);
}

/** A recorded reference for a fingerspelled letter, if anyone has recorded one. */
export function findLetter(letter: string, state: Pick<TeachState, "recordings" | "decks"> = useTeach.getState()): CustomSign | undefined {
  return state.recordings.find((r) => r.letter === letter) ?? state.decks.flatMap((d) => d.signs).find((s) => s.letter === letter);
}

/** This device's checks as a shareable pack (null when there are none). */
export function myPack(state: Pick<TeachState, "myReviews" | "myReviewId" | "author" | "region">): ReviewPack | null {
  if (!state.myReviews.length) return null;
  return {
    id: state.myReviewId,
    reviewer: state.author.trim() || "A fluent signer",
    region: state.region.trim() || undefined,
    createdAt: Date.now(),
    reviews: state.myReviews,
  };
}
