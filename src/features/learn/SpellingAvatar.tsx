/**
 * Remy fingerspelling one letter per queue item, so the caller knows which
 * letter is on screen. Lazy-loaded with three.js.
 */
import { useMemo } from "react";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import type { PlayerState, QueueItem, SignPlayer } from "@/avatar/playback";
import { letterGlosses } from "@/learn/fingerspell";
import { useLearn } from "@/stores/learn";

interface SpellingAvatarProps {
  word: string;
  /** Changing this replays the word. */
  take: number;
  onState?: (state: PlayerState) => void;
  onPlayer?: (player: SignPlayer | null) => void;
  label: string;
}

export default function SpellingAvatar({ word, take, onState, onPlayer, label }: SpellingAvatarProps) {
  const speed = useLearn((s) => s.speed);
  const mirror = useLearn((s) => s.mirror);
  // A fresh array identity per take restarts playback.
  const queue = useMemo<QueueItem[]>(() => letterGlosses(word).map((gloss) => ({ gloss, label: gloss.replace("-", ""), missing: false })), [word, take]);
  return <AvatarViewport queue={queue} mirror={mirror} playbackSpeed={speed} presentation="hands" onState={onState} onPlayer={onPlayer} label={label} />;
}
