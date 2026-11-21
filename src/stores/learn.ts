/**
 * Learning progress, stored only in this browser (localStorage). Nothing here
 * is personal: which signs you have seen, how they are scheduled for review,
 * which lessons you finished, and phrases you chose to practise.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SavedPhrase } from "@/learn/lessonPlan";
import { gradeCard, newCard, type Card, type Grade } from "@/learn/srs";
import { createId } from "@/lib/id";

export interface LessonRecord {
  completedAt: number;
  correct: number;
  total: number;
}

export type LearnSpeed = 0.5 | 0.75 | 1;

/** One camera practice attempt, kept so scoring can be tuned from real use. */
export interface PracticeLogEntry {
  at: number;
  key: string;
  score: number;
  distance: number;
  dimensions: Record<string, number>;
  tips: string[];
  leftHanded: boolean;
  /** The learner's answer to "Were these tips useful?", once given. */
  helpful?: boolean;
}

interface LearnState {
  cards: Record<string, Card>;
  lessons: Record<string, LessonRecord>;
  phrases: SavedPhrase[];
  /** Local dates (YYYY-MM-DD) with any practice, newest last, at most 60. */
  days: string[];
  leftHanded: boolean;
  /** Show the reference and your own figure mirrored, like a mirror. */
  mirror: boolean;
  speed: LearnSpeed;
  practiceLog: PracticeLogEntry[];
}

interface LearnStore extends LearnState {
  logPractice: (entry: PracticeLogEntry) => void;
  rateTips: (at: number, helpful: boolean) => void;
  clearPracticeLog: () => void;
  introduce: (glosses: readonly string[]) => void;
  grade: (gloss: string, grade: Grade, score?: number) => void;
  completeLesson: (key: string, correct: number, total: number) => void;
  savePhrase: (text: string, tokens: readonly string[]) => string;
  removePhrase: (id: string) => void;
  setPreference: <K extends "leftHanded" | "mirror" | "speed">(key: K, value: LearnState[K]) => void;
  reset: () => void;
}

const INITIAL: LearnState = { cards: {}, lessons: {}, phrases: [], days: [], leftHanded: false, mirror: true, speed: 0.75, practiceLog: [] };

export function localDay(time = Date.now()): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function withToday(days: string[]): string[] {
  const today = localDay();
  return days.at(-1) === today ? days : [...days, today].slice(-60);
}

export const useLearn = create<LearnStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      introduce: (glosses) => {
        const now = Date.now();
        const cards = { ...get().cards };
        let changed = false;
        for (const gloss of glosses) {
          if (cards[gloss]) continue;
          cards[gloss] = newCard(gloss, now);
          changed = true;
        }
        if (changed) set({ cards, days: withToday(get().days) });
      },

      grade: (gloss, grade, score) => {
        const now = Date.now();
        const current = get().cards[gloss] ?? newCard(gloss, now);
        const next = gradeCard(current, grade, now);
        if (score !== undefined) next.bestScore = Math.max(score, current.bestScore ?? 0);
        set({ cards: { ...get().cards, [gloss]: next }, days: withToday(get().days) });
      },

      completeLesson: (key, correct, total) => {
        set({
          lessons: { ...get().lessons, [key]: { completedAt: Date.now(), correct, total } },
          days: withToday(get().days),
        });
      },

      savePhrase: (text, tokens) => {
        const existing = get().phrases.find((p) => p.text.trim().toLowerCase() === text.trim().toLowerCase());
        if (existing) return existing.id;
        const phrase: SavedPhrase = { id: createId(), text: text.trim(), tokens: [...tokens], createdAt: Date.now() };
        set({ phrases: [phrase, ...get().phrases].slice(0, 50) });
        return phrase.id;
      },

      removePhrase: (id) => set({ phrases: get().phrases.filter((p) => p.id !== id) }),

      setPreference: (key, value) => set({ [key]: value } as Partial<LearnState>),

      logPractice: (entry) => set({ practiceLog: [entry, ...get().practiceLog].slice(0, 300) }),
      rateTips: (at, helpful) => set({ practiceLog: get().practiceLog.map((e) => (e.at === at ? { ...e, helpful } : e)) }),
      clearPracticeLog: () => set({ practiceLog: [] }),

      reset: () => set({ ...INITIAL }),
    }),
    {
      name: "parlance.learn.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cards, lessons, phrases, days, leftHanded, mirror, speed, practiceLog }) => ({ cards, lessons, phrases, days, leftHanded, mirror, speed, practiceLog }),
    },
  ),
);
