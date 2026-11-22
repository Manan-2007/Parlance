export interface HeardSpeech {
  transcript?: string;
  words: string[];
  finalWordCount: number;
  allFinal: boolean;
}
export function readSpeechResults(results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>): HeardSpeech & { transcript: string };
export function planLiveCommit(
  committed: readonly string[],
  heard: HeardSpeech,
  phraseHoldBack?: (words: readonly string[]) => number,
): { chunk: string; committed: string[] };
export function appendSpeechHistory(history: string, transcript: string, maxWords?: number): string;
