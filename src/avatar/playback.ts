export interface QueueItem {
  gloss: string;
  label: string;
  missing: boolean;
  kind?: 'word' | 'number' | 'fingerspelling';
}

export interface PlayerState {
  index: number;
  progress: number;
  playing: boolean;
  finished: boolean;
  transitioning: boolean;
}

export interface SignPlayer {
  play(): void;
  toggle(): void;
  restart(): void;
  step(index: number): void;
}

export type Presentation = "figure" | "hands";
