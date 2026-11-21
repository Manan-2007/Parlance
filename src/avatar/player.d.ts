import type { PlayerState, Presentation, QueueItem, SignPlayer } from "./playback";

export interface AvatarPlayer extends SignPlayer {
  setQueue(queue: readonly QueueItem[]): void;
  setOptions(options: { mirror: boolean; presentation: Presentation; speed: number; loop: boolean; suspended: boolean }): void;
  dispose(): void;
}

export function createAvatar(
  mount: HTMLElement,
  options?: {
    interactive?: boolean;
    onState?: (state: PlayerState) => void;
    onStatus?: (status: "loading" | "ready" | "error") => void;
  },
): AvatarPlayer;
