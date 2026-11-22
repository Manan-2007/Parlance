/**
 * Who you are in the Community, kept only in this browser: the name you chose
 * and the private token the local service gave you. Clearing it means joining
 * again with a new name (the old posts stay, under the old name).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Member } from "@/community/model";

interface CommunityStore {
  token: string | null;
  member: Member | null;
  setSession: (member: Member, token: string) => void;
  setMember: (member: Member) => void;
  signOut: () => void;
}

export const useCommunity = create<CommunityStore>()(
  persist(
    (set) => ({
      token: null,
      member: null,
      setSession: (member, token) => set({ member, token }),
      setMember: (member) => set({ member }),
      signOut: () => set({ member: null, token: null }),
    }),
    {
      name: "parlance.community.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
